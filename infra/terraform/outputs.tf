output "server_ip" {
  description = "Public IPv4 address of the web server"
  value       = hcloud_server.web.ipv4_address
}

output "server_name" {
  description = "Server name"
  value       = hcloud_server.web.name
}

output "deploy_static_files_command" {
  description = "Command to copy your local dist files to server"
  value       = "scp -r dist/* root@${hcloud_server.web.ipv4_address}:${var.app_dir}/"
}

output "open_website" {
  description = "HTTP URL of your server"
  value       = "http://${hcloud_server.web.ipv4_address}"
}

output "open_website_https" {
  description = "HTTPS URL when domain_name is configured"
  value       = trimspace(var.domain_name) != "" ? "https://${trimspace(var.domain_name)}" : null
}

output "ssl_setup_note" {
  description = "SSL setup status reminder"
  value       = trimspace(var.domain_name) != "" && trimspace(var.letsencrypt_email) != "" ? "SSL setup enabled via certbot. Ensure DNS A record for ${trimspace(var.domain_name)} points to ${hcloud_server.web.ipv4_address}." : "SSL not enabled. Set domain_name and letsencrypt_email in terraform.tfvars to provision Let's Encrypt certificate."
}
