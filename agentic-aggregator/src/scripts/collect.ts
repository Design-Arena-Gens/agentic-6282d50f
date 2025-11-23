import { collectAndAggregate } from "../lib/collect";
import { deliverAggregation } from "../lib/deliver";

async function main() {
  const result = await collectAndAggregate();
  console.log(JSON.stringify(result, null, 2));

  if (process.env.SEND_BRIEFING === "true") {
    const delivery = await deliverAggregation(result, {
      telegram: { enabled: process.env.SEND_TELEGRAM === "true" },
      email: { enabled: process.env.SEND_EMAIL === "true" },
    });
    console.log("Delivery:", delivery);
  }
}

main().catch((error) => {
  console.error("Collector failed", error);
  process.exit(1);
});
