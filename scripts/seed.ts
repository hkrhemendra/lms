import { resetData } from "../src/lib/data/seed";

resetData()
  .then(() => {
    console.log("Seeded /data with the college library sample.");
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
