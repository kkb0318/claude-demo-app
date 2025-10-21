output "resource_group_name" {
  description = "Name of the Resource Group"
  value       = azurerm_resource_group.main.name
}

output "resource_group_id" {
  description = "ID of the Resource Group"
  value       = azurerm_resource_group.main.id
}

output "acr_name" {
  description = "Name of the Azure Container Registry"
  value       = azurerm_container_registry.acr.name
}

output "acr_login_server" {
  description = "Login server URL for the Azure Container Registry"
  value       = azurerm_container_registry.acr.login_server
}

output "acr_admin_username" {
  description = "Admin username for the Azure Container Registry"
  value       = azurerm_container_registry.acr.admin_username
  sensitive   = true
}

output "acr_admin_password" {
  description = "Admin password for the Azure Container Registry"
  value       = azurerm_container_registry.acr.admin_password
  sensitive   = true
}

output "vnet_name" {
  description = "Name of the Virtual Network"
  value       = azurerm_virtual_network.main.name
}

output "vnet_id" {
  description = "ID of the Virtual Network"
  value       = azurerm_virtual_network.main.id
}

output "container_group_id" {
  description = "ID of the Container Group"
  value       = azurerm_container_group.api.id
}

output "container_group_fqdn" {
  description = "FQDN of the Container Group (not applicable for private IP)"
  value       = "N/A - Private IP only"
}

output "container_private_ip" {
  description = "Private IP address of the Container Instance"
  value       = azurerm_container_group.api.ip_address
}

output "subnet_id" {
  description = "ID of the ACI subnet"
  value       = azurerm_subnet.aci.id
}

output "network_security_group_id" {
  description = "ID of the Network Security Group"
  value       = azurerm_network_security_group.aci.id
}

output "api_endpoint" {
  description = "API endpoint URL (accessible from within VNet)"
  value       = "http://${azurerm_container_group.api.ip_address}:3001"
}

output "health_check_endpoint" {
  description = "Health check endpoint (accessible from within VNet)"
  value       = "http://${azurerm_container_group.api.ip_address}:3001/api/health"
}
