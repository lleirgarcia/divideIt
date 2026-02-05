output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = module.alb.alb_dns_name
}

output "backend_url" {
  description = "Backend URL"
  value       = "http://${module.alb.alb_dns_name}"
}

output "frontend_url" {
  description = "Frontend URL"
  value       = "https://${module.alb.alb_dns_name}"
}

output "ecs_cluster_name" {
  description = "ECS Cluster name"
  value       = module.ecs.cluster_name
}

output "s3_bucket_name" {
  description = "S3 bucket name for uploads"
  value       = module.s3.uploads_bucket_name
}
