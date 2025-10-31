variable "subscription_id" {
  description = "Azure Subscription ID"
  type        = string
  default     = "77164a13-2e87-4b85-9be0-acaaffaec1c5"
}

variable "resource_group_name" {
  description = "Name of the resource group for bastion VM"
  type        = string
  default     = "rg-deploy-app-bastion"
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "japaneast"
}

variable "bastion_vnet_name" {
  description = "Name of the bastion VNet"
  type        = string
  default     = "vnet-deploy-app-bastion"
}

variable "bastion_vnet_cidr" {
  description = "CIDR block for bastion VNet"
  type        = string
  default     = "10.2.0.0/16"
}

variable "bastion_subnet_cidr" {
  description = "CIDR block for bastion subnet"
  type        = string
  default     = "10.2.1.0/24"
}

variable "vm_size" {
  description = "Size of the VM (B1s is the cheapest)"
  type        = string
  default     = "Standard_B1s"
}

variable "admin_username" {
  description = "Admin username for the VM"
  type        = string
  default     = "azureuser"
}

variable "ssh_public_key_path" {
  description = "Path to SSH public key for VM access"
  type        = string
  default     = "./bastion_key.pub"
}

# Existing infrastructure variables for peering
variable "existing_resource_group_name" {
  description = "Name of the existing resource group with the app VNet"
  type        = string
  default     = "rg-deploy-app-demo"
}

variable "existing_vnet_name" {
  description = "Name of the existing VNet to peer with"
  type        = string
  default     = "vnet-coding-agent"
}
