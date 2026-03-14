resource "hcloud_ssh_key" "deployer" {
  name       = "${var.project_name}-deployer"
  public_key = var.ssh_public_key
}

locals {
  use_ssl     = trimspace(var.domain_name) != "" && trimspace(var.letsencrypt_email) != ""
  server_name = trimspace(var.domain_name) != "" ? trimspace(var.domain_name) : "_"
}

resource "hcloud_firewall" "web" {
  name = "${var.project_name}-fw"

  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "22"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "80"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "443"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction       = "out"
    protocol        = "tcp"
    port            = "1-65535"
    destination_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction       = "out"
    protocol        = "udp"
    port            = "1-65535"
    destination_ips = ["0.0.0.0/0", "::/0"]
  }

  apply_to {
    server = hcloud_server.web.id
  }
}

resource "hcloud_server" "web" {
  name        = "${var.project_name}-web"
  server_type = var.server_type
  image       = var.image
  location    = var.location
  ssh_keys    = [hcloud_ssh_key.deployer.id]

  user_data = <<-CLOUD_INIT
    #cloud-config
    package_update: true
    package_upgrade: true
    packages:
      - nginx
      - certbot
      - python3-certbot-nginx

    write_files:
      - path: /etc/nginx/sites-available/default
        permissions: '0644'
        content: |
          server {
            listen 80 default_server;
            listen [::]:80 default_server;

            server_name ${local.server_name};

            root ${var.app_dir};
            index index.html;

            location / {
              try_files $uri $uri/ /index.html;
            }
          }
      - path: ${var.app_dir}/index.html
        permissions: '0644'
        content: |
          <!doctype html>
          <html>
            <head>
              <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <title>Museum of Internet</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 32px; background: #f2f5ef; color: #222; }
                .card { max-width: 760px; margin: 40px auto; background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 12px 36px rgba(0,0,0,0.08); }
                code { background: #f4f4f4; padding: 2px 6px; border-radius: 4px; }
              </style>
            </head>
            <body>
              <div class="card">
                <h1>Museum of Internet server is ready</h1>
                <p>Upload your Vite build output from <code>dist/</code> to <code>${var.app_dir}/</code>.</p>
                <p>Example:</p>
                <pre>scp -r dist/* root@SERVER_IP:${var.app_dir}/</pre>
              </div>
            </body>
          </html>

    runcmd:
      - mkdir -p ${var.app_dir}
      - chown -R www-data:www-data ${var.app_dir}
      - nginx -t
      - systemctl enable nginx
      - systemctl restart nginx
%{ if local.use_ssl ~}
      - certbot --nginx --non-interactive --agree-tos --email ${trimspace(var.letsencrypt_email)} -d ${trimspace(var.domain_name)} --redirect || true
      - systemctl enable certbot.timer || true
      - systemctl start certbot.timer || true
%{ endif ~}
  CLOUD_INIT
}
