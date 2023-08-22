export class DataService {
  context;
  headers;

  constructor(context) {
    this.context = context;
    this.headers = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + this.context.appData.accessToken.secretId,
      'Api-Application': this.context.appData.apiAppId,
      'Api-Company': this.context.appData.company.publicId,
      'Api-Version': '2',
    };
  }

  async getAllRawMetrics() {
    if (!this.context.inputs.dataSource?.metric) {
      return null;
    }
    const tagSourceSlug = this.context.inputs.dataSource.metric.selector
      .split('Agent#selected:')[1]
      .split('.tag.')[0];
    const dataSource = await this._getAgentDataSource(tagSourceSlug);
    if (!dataSource) {
      return null;
    }

    const tagSlug =
      this.context.inputs.dataSource.metric.selector.split('.tag.')[1];
    const allMetricsOfTagSlug = await this._getAllRawMetrics(
      dataSource.publicId,
      [tagSlug],
      true,
      0,
      []
    );
    return allMetricsOfTagSlug.map((x) => ({
      time: Date.parse(x.time),
      value: x.values[tagSlug],
    }));
  }

  async _getAllRawMetrics(
    sourceId,
    tagSlugs,
    hasNext = true,
    offset = 0,
    metrics = []
  ) {
    if (!hasNext) {
      // lastPointOfPreviousPeriod is used to fill in the gap between the last point of the previous period and the first point of the current period.
      const lastPointOfPreviousPeriod =
        await this._getLastPointOfPreviousPeriod(sourceId, tagSlugs);
      return [...metrics, lastPointOfPreviousPeriod];
    }

    const queryLimit = 5000;
    const start = this._toIXONISOString(this.context.timeRange.from);
    const end = this._toIXONISOString(this.context.timeRange.to);
    const url = this.context.getApiUrl('DataList');
    const body = {
      start,
      end,
      source: { publicId: sourceId },
      tags: tagSlugs.map((slug) => ({
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
    }).then((res) => res.json());

    metrics = [...metrics, ...response.data.points];
    offset += queryLimit;
    hasNext = response.data.points.length === queryLimit;

    return this._getAllRawMetrics(sourceId, tagSlugs, hasNext, offset, metrics);
  }

  async _getLastPointOfPreviousPeriod(sourceId, tagSlugs) {
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
      source: { publicId: sourceId },
      tags: tagSlugs.map((slug) => ({
        slug: slug,
        preAggr: 'raw',
        queries: [
          {
            postAggr: 'last',
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
    }).then((res) => res.json());
    const lastPointOfPreviousPeriod = response.data.points[0];
    // We have to change the time here because the API returns data buckets, with the time of a bucket being the start of the bucket.
    // There is only 1 bucket if we use limit 1 therefore we need to change the time to the end of the bucket.
    return { time: end, values: lastPointOfPreviousPeriod.values };
  }

  _toIXONISOString(milliSeconds) {
    return new Date(milliSeconds).toISOString().split('.')[0] + 'Z';
  }

  async _getAgentDataSource(slug) {
    return new Promise((resolve, reject) => {
      const client = this.context.createResourceDataClient();
      client.query(
        { selector: 'Agent', fields: ['publicId'] },
        async ([result]) => {
          if (!result.data) {
            reject();
          }
          const agent = result.data;
          const url =
            this.context.getApiUrl('AgentDataSourceList', {
              agentId: agent.publicId,
            }) +
            `?fields=*,source.publicId,agent.publicId&filters=eq(slug,"${slug}")`;
          const response = await fetch(url, {
            headers: this.headers,
            method: 'GET',
          }).then((res) => res.json());
          resolve(response.data[0] || null);
        }
      );
    });
  }

  _getFilters(kwargs) {
    return kwargs.length === 0
      ? ''
      : `&filters=in(${kwargs
          .map((x) => `${x.property},"${x.values.join('","')}"`)
          .join(')&filters=in(')})`;
  }
}
