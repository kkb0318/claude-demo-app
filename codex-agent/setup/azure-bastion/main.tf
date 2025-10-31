# Resource Group for Bastion VM
resource "azurerm_resource_group" "bastion" {
  name     = var.resource_group_name
  location = var.location
}

# Virtual Network for Bastion
resource "azurerm_virtual_network" "bastion" {
  name                = var.bastion_vnet_name
  address_space       = [var.bastion_vnet_cidr]
  location            = azurerm_resource_group.bastion.location
  resource_group_name = azurerm_resource_group.bastion.name
}

# Subnet for Bastion VM
resource "azurerm_subnet" "bastion" {
  name                 = "snet-deploy-app-bastion"
  resource_group_name  = azurerm_resource_group.bastion.name
  virtual_network_name = azurerm_virtual_network.bastion.name
  address_prefixes     = [var.bastion_subnet_cidr]
}

# Network Security Group for Bastion VM
resource "azurerm_network_security_group" "bastion" {
  name                = "nsg-deploy-app-bastion"
  location            = azurerm_resource_group.bastion.location
  resource_group_name = azurerm_resource_group.bastion.name

  # Allow SSH from internet
  security_rule {
    name                       = "AllowSSH"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  # Allow all outbound traffic
  security_rule {
    name                       = "AllowAllOutbound"
    priority                   = 100
    direction                  = "Outbound"
    access                     = "Allow"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
}

# Associate NSG with Subnet
resource "azurerm_subnet_network_security_group_association" "bastion" {
  subnet_id                 = azurerm_subnet.bastion.id
  network_security_group_id = azurerm_network_security_group.bastion.id
}

# Public IP for Bastion VM
resource "azurerm_public_ip" "bastion" {
  name                = "pip-deploy-app-bastion"
  location            = azurerm_resource_group.bastion.location
  resource_group_name = azurerm_resource_group.bastion.name
  allocation_method   = "Static"
  sku                 = "Standard"
}

# Network Interface for Bastion VM
resource "azurerm_network_interface" "bastion" {
  name                = "nic-deploy-app-bastion"
  location            = azurerm_resource_group.bastion.location
  resource_group_name = azurerm_resource_group.bastion.name

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.bastion.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.bastion.id
  }
}

# Bastion Linux VM (using cheap B1s size)
resource "azurerm_linux_virtual_machine" "bastion" {
  name                = "vm-deploy-app-bastion"
  location            = azurerm_resource_group.bastion.location
  resource_group_name = azurerm_resource_group.bastion.name
  size                = var.vm_size
  admin_username      = var.admin_username

  network_interface_ids = [
    azurerm_network_interface.bastion.id,
  ]

  admin_ssh_key {
    username   = var.admin_username
    public_key = file(var.ssh_public_key_path)
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts-gen2"
    version   = "latest"
  }

  # Install curl for testing
  custom_data = base64encode(<<-EOF
    #!/bin/bash
    apt-get update
    apt-get install -y curl
  EOF
  )
}

# Data source for existing VNet
data "azurerm_virtual_network" "existing" {
  name                = var.existing_vnet_name
  resource_group_name = var.existing_resource_group_name
}

# VNet Peering: Bastion VNet -> Existing VNet
resource "azurerm_virtual_network_peering" "bastion_to_existing" {
  name                      = "peer-deploy-app-bastion-to-app"
  resource_group_name       = azurerm_resource_group.bastion.name
  virtual_network_name      = azurerm_virtual_network.bastion.name
  remote_virtual_network_id = data.azurerm_virtual_network.existing.id
  allow_forwarded_traffic   = true
  allow_gateway_transit     = false
  allow_virtual_network_access = true
}

# VNet Peering: Existing VNet -> Bastion VNet
resource "azurerm_virtual_network_peering" "existing_to_bastion" {
  name                      = "peer-deploy-app-to-bastion"
  resource_group_name       = var.existing_resource_group_name
  virtual_network_name      = var.existing_vnet_name
  remote_virtual_network_id = azurerm_virtual_network.bastion.id
  allow_forwarded_traffic   = true
  allow_gateway_transit     = false
  allow_virtual_network_access = true
}
