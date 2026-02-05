# Terraform Infrastructure as Code

This directory contains Terraform configurations for deploying divideIt to AWS.

## Prerequisites

1. Install Terraform (>= 1.0)
2. Configure AWS credentials:
   ```bash
   aws configure
   ```
3. Set up remote state backend (optional but recommended)

## Structure

```
terraform/
├── main.tf              # Main configuration
├── variables.tf         # Input variables
├── outputs.tf           # Output values
├── modules/
│   ├── vpc/            # VPC and networking
│   ├── ecs/            # ECS cluster
│   ├── alb/            # Application Load Balancer
│   ├── s3/             # S3 buckets
│   └── logs/           # CloudWatch Logs
└── environments/
    ├── staging.tfvars  # Staging variables
    └── production.tfvars # Production variables
```

## Usage

### Initialize Terraform

```bash
cd terraform
terraform init
```

### Plan Changes

```bash
# Staging
terraform plan -var-file=environments/staging.tfvars

# Production
terraform plan -var-file=environments/production.tfvars
```

### Apply Changes

```bash
# Staging
terraform apply -var-file=environments/staging.tfvars

# Production
terraform apply -var-file=environments/production.tfvars
```

### Destroy Infrastructure

```bash
terraform destroy -var-file=environments/staging.tfvars
```

## Variables

Create `environments/staging.tfvars` and `environments/production.tfvars`:

```hcl
aws_region     = "us-east-1"
environment    = "staging"
vpc_cidr       = "10.0.0.0/16"
backend_image  = "ghcr.io/your-org/divideit-backend:staging-latest"
frontend_image = "ghcr.io/your-org/divideit-frontend:staging-latest"
desired_count  = 2
min_capacity   = 1
max_capacity    = 5
```

## Outputs

After applying, Terraform will output:
- ALB DNS name
- Backend URL
- Frontend URL
- ECS Cluster name
- S3 bucket name

## Best Practices

1. **Use remote state** - Store state in S3 with versioning
2. **Use workspaces** - Separate state per environment
3. **Review plans** - Always review before applying
4. **Version control** - Commit Terraform files
5. **Lock state** - Use DynamoDB for state locking
6. **Tag resources** - All resources are tagged automatically

## Next Steps

After infrastructure is created:
1. Deploy ECS tasks using CI/CD
2. Configure DNS to point to ALB
3. Set up SSL certificates (ACM)
4. Configure monitoring and alerts
