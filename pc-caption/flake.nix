# ~/my-project/flake.nix
{
  description = "PC-Caption project development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs }:
    let
      system = "aarch64-darwin";
      pkgs = nixpkgs.legacyPackages.${system};
    in
    {
      devShells.${system}.default = pkgs.mkShell {
        name = "pc-caption";
        
        buildInputs = with pkgs; [
          nodejs_24
        ];

        shellHook = ''
          echo "Node: $(node --version)"
        '';
      };
    };
}
