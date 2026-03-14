variable "hcloud_token" {
  description = "Hetzner Cloud API token"
  type        = string
  sensitive   = true
}

variable "project_name" {
  description = "Name prefix for resources"
  type        = string
  default     = "museum-of-internet"
}

variable "location" {
  description = "Hetzner location"
  type        = string
  default     = "fsn1"
}

variable "server_type" {
  description = "Hetzner server type"
  type        = string
  default     = "cx23"
}

variable "image" {
  description = "Server image"
  type        = string
  default     = "ubuntu-24.04"
}

variable "ssh_public_key" {
  description = "SSH public key content used for provisioning access"
  type        = string
}

variable "app_dir" {
  description = "Directory where static app files will be served from"
  type        = string
  default     = "/var/www/museum-of-internet"
}

variable "domain_name" {
  description = "Domain name for HTTPS (must point to server IP); leave empty to keep HTTP-only"
  type        = string
  default     = ""
}

variable "letsencrypt_email" {
  description = "Email for Let's Encrypt registration (required when domain_name is set)"
  type        = string
  default     = ""
}
