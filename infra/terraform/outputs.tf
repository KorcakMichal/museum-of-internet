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
