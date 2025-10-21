# Resource Group
resource "azurerm_resource_group" "main" {
  name     = var.resource_group_name
  location = var.location
  tags     = var.tags
}

# Azure Container Registry
resource "azurerm_container_registry" "acr" {
  name                = var.acr_name
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = var.acr_sku
  admin_enabled       = true
  tags                = var.tags
}

# Virtual Network
resource "azurerm_virtual_network" "main" {
  name                = var.vnet_name
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  address_space       = [var.vnet_address_space]
  tags                = var.tags
}

# Network Security Group for Container Instances
resource "azurerm_network_security_group" "aci" {
  name                = "nsg-deploy-app-agent"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  # Allow inbound HTTP from VNet only
  security_rule {
    name                       = "AllowHTTPFromVNet"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "3001"
    source_address_prefix      = "VirtualNetwork"
    destination_address_prefix = "*"
  }

  # Allow outbound HTTPS for API calls
  security_rule {
    name                       = "AllowHTTPSOutbound"
    priority                   = 100
    direction                  = "Outbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "*"
    destination_address_prefix = "Internet"
  }

  # Allow outbound HTTP
  security_rule {
    name                       = "AllowHTTPOutbound"
    priority                   = 101
    direction                  = "Outbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "80"
    source_address_prefix      = "*"
    destination_address_prefix = "Internet"
  }

  tags = var.tags
}

# Subnet for Container Instances
resource "azurerm_subnet" "aci" {
  name                 = "snet-deploy-app-agent"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [var.subnet_address_prefix]

  delegation {
    name = "aci-delegation"

    service_delegation {
      name    = "Microsoft.ContainerInstance/containerGroups"
      actions = ["Microsoft.Network/virtualNetworks/subnets/action"]
    }
  }
}

# Associate NSG with subnet
resource "azurerm_subnet_network_security_group_association" "aci" {
  subnet_id                 = azurerm_subnet.aci.id
  network_security_group_id = azurerm_network_security_group.aci.id
}

# Container Group (Azure Container Instance)
resource "azurerm_container_group" "api" {
  name                = "aci-deploy-app-agent"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  os_type             = "Linux"
  subnet_ids          = [azurerm_subnet.aci.id]
  ip_address_type     = "Private"
  restart_policy      = "Always"

  # Image registry credentials from ACR
  image_registry_credential {
    server   = azurerm_container_registry.acr.login_server
    username = azurerm_container_registry.acr.admin_username
    password = azurerm_container_registry.acr.admin_password
  }

  container {
    name   = "deploy-app-agent-api"
    image  = "${azurerm_container_registry.acr.login_server}/${var.container_image}"
    cpu    = "1.0"
    memory = "2.0"

    ports {
      port     = 3001
      protocol = "TCP"
    }

    environment_variables = {
      NODE_ENV   = "production"
      PORT       = "3001"
      AWS_REGION = var.aws_region
    }

    # Secure environment variables
    secure_environment_variables = {
      OPENAI_API_KEY        = var.openai_api_key
      AWS_ACCESS_KEY_ID     = var.aws_access_key_id
      AWS_SECRET_ACCESS_KEY = var.aws_secret_access_key
    }

    # Liveness probe
    liveness_probe {
      http_get {
        path   = "/api/health"
        port   = 3001
        scheme = "http"
      }
      initial_delay_seconds = 30
      period_seconds        = 30
      failure_threshold     = 3
      timeout_seconds       = 5
    }

    # Readiness probe
    readiness_probe {
      http_get {
        path   = "/api/health"
        port   = 3001
        scheme = "http"
      }
      initial_delay_seconds = 10
      period_seconds        = 10
      failure_threshold     = 3
      timeout_seconds       = 5
    }
  }

  tags = var.tags
}
