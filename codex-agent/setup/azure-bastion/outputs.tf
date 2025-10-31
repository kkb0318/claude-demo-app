output "bastion_public_ip" {
  description = "Public IP address of the bastion VM"
  value       = azurerm_public_ip.bastion.ip_address
}

output "bastion_private_ip" {
  description = "Private IP address of the bastion VM"
  value       = azurerm_network_interface.bastion.private_ip_address
}

output "bastion_vm_name" {
  description = "Name of the bastion VM"
  value       = azurerm_linux_virtual_machine.bastion.name
}

output "ssh_command" {
  description = "SSH command to connect to the bastion VM"
  value       = "ssh -i bastion_key ${var.admin_username}@${azurerm_public_ip.bastion.ip_address}"
}

output "test_api_command" {
  description = "Command to test the API from bastion VM"
  value       = "curl http://10.1.1.4:3001/api/health"
}

output "bastion_vnet_id" {
  description = "ID of the bastion VNet"
  value       = azurerm_virtual_network.bastion.id
}

output "peering_status" {
  description = "VNet peering configuration"
  value = {
    bastion_to_existing = azurerm_virtual_network_peering.bastion_to_existing.name
    existing_to_bastion = azurerm_virtual_network_peering.existing_to_bastion.name
  }
}
