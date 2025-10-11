import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const AWS_PROFILE = "agent-galaxy";

interface CommandResult {
  stdout: string;
  stderr: string;
}

async function runCommand(command: string, description: string): Promise<CommandResult> {
  console.log(`\n🔄 ${description}...`);
  try {
    const result = await execAsync(command, {
      env: { ...process.env, AWS_PROFILE },
    });
    if (result.stdout) {
      console.log(result.stdout);
    }
    if (result.stderr) {
      console.error(result.stderr);
    }
    return result;
  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);
    throw error;
  }
}

async function verifyAwsProfile(): Promise<void> {
  console.log("🔐 Verifying AWS profile...");
  try {
    const result = await execAsync(`aws sts get-caller-identity --profile ${AWS_PROFILE}`);
    const identity = JSON.parse(result.stdout);
    console.log(`✅ AWS Profile verified: ${AWS_PROFILE}`);
    console.log(`   Account: ${identity.Account}`);
    console.log(`   ARN: ${identity.Arn}`);
  } catch (error: any) {
    console.error(`❌ Failed to verify AWS profile: ${AWS_PROFILE}`);
    console.error("Please configure your AWS credentials first.");
    throw error;
  }
}

async function deploy(): Promise<void> {
  console.log("\n🚀 Starting deployment...\n");

  await verifyAwsProfile();

  // Build TypeScript
  await runCommand("pnpm run build", "Building TypeScript");

  // Synthesize CDKTF
  await runCommand("pnpm run synth", "Synthesizing CDKTF");

  // Navigate to Terraform directory and run commands
  const terraformDir = "cdktf.out/stacks/simple-web-hosting";
  
  // Initialize Terraform
  await runCommand(
    `cd ${terraformDir} && terraform init -reconfigure`,
    "Initializing Terraform"
  );

  // Apply Terraform
  console.log("\n⚠️  This will create or update AWS resources.");
  await runCommand(
    `cd ${terraformDir} && terraform apply -auto-approve`,
    "Applying Terraform changes"
  );

  console.log("\n✅ Deployment completed successfully!");

  // Show outputs
  const outputResult = await execAsync(
    `cd ${terraformDir} && terraform output -json`,
    { env: { ...process.env, AWS_PROFILE } }
  );
  const outputs = JSON.parse(outputResult.stdout);
  
  console.log("\n📋 Outputs:");
  for (const [key, value] of Object.entries(outputs)) {
    console.log(`   ${key}: ${(value as any).value}`);
  }
}

async function destroy(): Promise<void> {
  console.log("\n🗑️  Starting resource destruction...\n");

  await verifyAwsProfile();

  // Build TypeScript
  await runCommand("pnpm run build", "Building TypeScript");

  // Synthesize CDKTF
  await runCommand("pnpm run synth", "Synthesizing CDKTF");

  const terraformDir = "cdktf.out/stacks/simple-web-hosting";

  // Empty S3 bucket first
  const bucketName = process.env.BUCKET_NAME || "agent-galaxy-demo-website-2025";
  console.log(`\n🪣 Emptying S3 bucket: ${bucketName}`);
  try {
    await execAsync(
      `aws s3 rm s3://${bucketName} --recursive --profile ${AWS_PROFILE}`
    );
    console.log("✅ S3 bucket emptied");
  } catch (error) {
    console.log("⚠️  Bucket might be empty or doesn't exist");
  }

  // Destroy Terraform resources
  console.log("\n⚠️  This will DELETE all AWS resources!");
  await runCommand(
    `cd ${terraformDir} && terraform destroy -auto-approve`,
    "Destroying Terraform resources"
  );

  console.log("\n✅ All resources destroyed successfully!");
}

async function plan(): Promise<void> {
  console.log("\n📋 Planning changes...\n");

  await verifyAwsProfile();

  // Build TypeScript
  await runCommand("pnpm run build", "Building TypeScript");

  // Synthesize CDKTF
  await runCommand("pnpm run synth", "Synthesizing CDKTF");

  const terraformDir = "cdktf.out/stacks/simple-web-hosting";

  // Initialize if needed
  await runCommand(
    `cd ${terraformDir} && terraform init -reconfigure`,
    "Initializing Terraform"
  );

  // Plan
  await runCommand(
    `cd ${terraformDir} && terraform plan`,
    "Planning Terraform changes"
  );

  console.log("\n✅ Plan completed!");
}

async function main() {
  const command = process.argv[2];

  try {
    switch (command) {
      case "deploy":
        await deploy();
        break;
      case "destroy":
        await destroy();
        break;
      case "plan":
        await plan();
        break;
      default:
        console.log("Usage: pnpm run <command>");
        console.log("");
        console.log("Commands:");
        console.log("  deploy  - Create or update AWS resources");
        console.log("  destroy - Delete all AWS resources");
        console.log("  plan    - Show what changes will be made");
        process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ Command failed");
    process.exit(1);
  }
}

main();
