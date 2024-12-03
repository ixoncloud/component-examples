import type { ComponentContext, Agent, AgentDataTag, AgentDataSource, ResourceDataClient } from '@ixon-cdk/types';

type Metric = {
  time: string;
  values: {
    [key: string]: number;
  };
};

export class DataService {
  context: ComponentContext;
  headers;
  resourceClient: ResourceDataClient;

  constructor(context: ComponentContext, resourceClient: ResourceDataClient) {
    this.context = context;
    this.resourceClient = resourceClient;
    this.headers = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + this.context.appData.accessToken.secretId,
      'Api-Application': this.context.appData.apiAppId,
      'Api-Company': this.context.appData.company.publicId,
      'Api-Version': '2',
    };
  }

  async getAllRawMetrics(): Promise<{ time: number; value: any }[] | null> {
    if (!this.context.inputs.dataSource?.metric) {
      return null;
    }

    const tagSlug = this.context.inputs.dataSource.metric.selector.split('.tag.')[1];
    const sourceSlug = this.context.inputs.dataSource.metric.selector.split('.tag.')[0].split('Agent#selected:')[1];

    const agent = await this._getAgent();

    const sources: AgentDataSource[] = await this._getDataSources(agent, sourceSlug);
    const tags: AgentDataTag[] = await this._getTags(agent, [tagSlug]);
    const filteredTags = tags.filter(tag => {
      return sources.find(source => source.publicId === tag.source?.publicId);
    });

    const sourceId = filteredTags.find(x => x.slug === tagSlug)?.source?.publicId;
    if (!sourceId) {
      return null;
    }

    const allMetricsOfTagSlug = await this._getAllRawMetrics(sourceId, [tagSlug], true, 0, []);

    return allMetricsOfTagSlug.map(x => ({
      time: Date.parse(x.time),
      value: x.values[tagSlug],
    }));
  }

  async _getAllRawMetrics(
    sourceId: string,
    tagSlugs: string[],
    hasNext = true,
    offset = 0,
    metrics: Metric[] = [],
  ): Promise<Metric[]> {
    if (!hasNext) {
      // lastPointOfPreviousPeriod is used to fill in the gap between the last point of the previous period and the first point of the current period.
      const lastPointOfPreviousPeriod = await this._getLastPointOfPreviousPeriod(sourceId, tagSlugs);
      if (lastPointOfPreviousPeriod) {
        return [...metrics, lastPointOfPreviousPeriod];
      }
      return metrics;
    }

    const queryLimit = 5000;
    const start = this._toIXONISOString(this.context.timeRange.from);
    const end = this._toIXONISOString(this.context.timeRange.to);
    const url = this.context.getApiUrl('DataList');
    const body = {
      start,
      end,
      timeZone: 'UTC',
      source: { publicId: sourceId },
      tags: tagSlugs.map(slug => ({
        slug: slug,
        preAggr: 'raw',
        queries: [
          {
            ref: slug,
            limit: queryLimit,
            offset: offset,
          },
        ],
      })),
    };
    const response = await fetch(url, {
      headers: this.headers,
      method: 'POST',
      body: JSON.stringify(body),
    }).then(res => res.json());

    metrics = [...metrics, ...response.data.points];
    offset += queryLimit;
    hasNext = response.data.points.length === queryLimit;

    return this._getAllRawMetrics(sourceId, tagSlugs, hasNext, offset, metrics);
  }

  async _getLastPointOfPreviousPeriod(sourceId: string, tagSlugs: string[]) {
    // fixed a bug where the last point of the previous period was not shown:
    //
    // we have to look back for the latest state outside of the current period
    // to fill in the gap between the last point of the previous period and the
    // first point of the current period.
    // we do this by taking the first unix timestamp
    const initialUnixTimestamp = 0;
    const start = this._toIXONISOString(initialUnixTimestamp);
    const end = this._toIXONISOString(this.context.timeRange.from);
    const url = this.context.getApiUrl('DataList');
    const body = {
      start,
      end,
      timeZone: 'UTC',
      source: { publicId: sourceId },
      tags: tagSlugs.map(slug => ({
        slug: slug,
        preAggr: 'raw',
        queries: [
          {
            postAggr: 'raw',
            ref: slug,
            limit: 1,
          },
        ],
      })),
    };
    const response = await fetch(url, {
      headers: this.headers,
      method: 'POST',
      body: JSON.stringify(body),
    }).then(res => res.json());
    const lastPointOfPreviousPeriod = response.data.points[0];
    if (!lastPointOfPreviousPeriod) {
      return null;
    }
    // We have to change the time here because the API returns data buckets, with the time of a bucket being the start of the bucket.
    // There is only 1 bucket if we use limit 1 therefore we need to change the time to the end of the bucket.
    return { time: end, values: lastPointOfPreviousPeriod.values };
  }

  _toIXONISOString(milliSeconds: number) {
    return new Date(milliSeconds).toISOString().split('.')[0] + 'Z';
  }

  private _getAgent(): Promise<Agent> {
    let cancel: Function;
    return new Promise((resolve, reject) => {
      cancel = this.resourceClient.query({ selector: 'Agent', fields: ['publicId'] }, ([result]) => {
        if (result.data) {
          if (cancel) {
            cancel();
          }
          resolve(result.data);
        } else {
          reject(new Error('Agent not found'));
        }
      });
    });
  }

  async _getDataSources(agent: Agent, slug: string): Promise<AgentDataSource[]> {
    const url =
      this.context.getApiUrl('AgentDataSourceList', {
        agentId: agent.publicId,
      }) +
      '?fields=*,publicId,agent.publicId' +
      `&filters=eq(slug,"${slug}")`;
    const response = await fetch(url, {
      headers: this.headers,
      method: 'GET',
    }).then(res => res.json());
    return response.data;
  }

  async _getTags(agent: Agent, slugs: string[]): Promise<AgentDataTag[]> {
    const filters = this._getFilters([{ property: 'slug', values: slugs }]);
    const url =
      this.context.getApiUrl('AgentDataTagList', {
        agentId: agent.publicId,
      }) +
      '?fields=*,source.publicId,agent.publicId' +
      filters;
    const response = await fetch(url, {
      headers: this.headers,
      method: 'GET',
    }).then(res => res.json());
    return response.data;
  }

  _getFilters(kwargs: { property: string; values: string[] }[]) {
    return kwargs.length === 0
      ? ''
      : `&filters=in(${kwargs.map(x => `${x.property},"${x.values.join('","')}"`).join(')&filters=in(')})`;
  }
}
