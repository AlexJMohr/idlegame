resource "proxmox_virtual_environment_container" "idlegame" {
  node_name   = var.proxmox_node
  description = "idlegame"

  operating_system {
    template_file_id = var.ubuntu_template_file_id
    type             = "ubuntu"
  }

  initialization {
    hostname = "idlegame"

    ip_config {
      ipv4 {
        address = "dhcp"
      }
    }

    user_account {
      keys = [trimspace(file(pathexpand(var.ssh_public_key_path)))]
    }
  }

  network_interface {
    name   = "eth0"
    bridge = "vmbr0"
  }

  disk {
    datastore_id = "local-zfs"
    size         = var.container_disk_size
  }

  cpu {
    cores = var.container_cores
  }

  memory {
    dedicated = var.container_memory
  }

  unprivileged = true

  features {
    nesting = true # required for Docker inside LXC
  }

  started = true
}

# Render setup script with secrets — gitignored, marked sensitive in state
resource "local_sensitive_file" "setup_script" {
  content = templatefile("${path.module}/setup.sh.tftpl", {
    tunnel_token = cloudflare_zero_trust_tunnel_cloudflared.idlegame.tunnel_token
    github_pat   = var.github_pat
    github_repo  = var.github_repo
  })
  filename        = "${path.module}/.setup-rendered.sh"
  file_permission = "0600"
}

# Run setup inside the container via pct exec on the Proxmox host —
# no need to know the container's DHCP-assigned IP
resource "null_resource" "setup" {
  depends_on = [
    proxmox_virtual_environment_container.idlegame,
    local_sensitive_file.setup_script,
  ]

  provisioner "local-exec" {
    command = "ssh -o StrictHostKeyChecking=no ${var.proxmox_ssh_user}@${var.proxmox_host} 'pct exec ${proxmox_virtual_environment_container.idlegame.vm_id} -- bash -s' < ${local_sensitive_file.setup_script.filename}"
  }
}
