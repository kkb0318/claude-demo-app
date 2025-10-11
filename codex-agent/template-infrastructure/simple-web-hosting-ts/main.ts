import { App } from "cdktf";
import { SimpleWebHostingStack } from "./src/tf";
import * as dotenv from "dotenv";

dotenv.config();

const app = new App();

new SimpleWebHostingStack(app, "simple-web-hosting", {
  bucketName: process.env.BUCKET_NAME || "my-website-bucket-12345",
  awsRegion: process.env.AWS_REGION || "ap-northeast-1", 
  environment: process.env.ENVIRONMENT || "dev",
  defaultRootObject: process.env.DEFAULT_ROOT_OBJECT || "index.html",
  cloudfrontPriceClass: process.env.CLOUDFRONT_PRICE_CLASS || "PriceClass_100",
  resourcePrefix: process.env.RESOURCE_PREFIX,
});

app.synth();