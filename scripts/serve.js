const prompts = require("prompts");
const { ConfigService } = require("@ixon-cdk/core");

async function main() {
  const choice = await prompts({
    type: "select",
    name: "name",
    message: "Pick an example",
    choices: Object.keys(new ConfigService()._config.components).map((name) => {
      return { title: name, value: name };
    }),
  });

  if (choice.name) {
    require("@ixon-cdk/runner/lib/simulate")(choice.name);
  }
}

main();
