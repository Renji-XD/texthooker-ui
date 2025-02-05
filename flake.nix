{
  description = "texthooker-ui";

  inputs = {
    nixpkgs.url = "nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = {
    self,
    nixpkgs,
    flake-utils,
  }:
    flake-utils.lib.eachDefaultSystem (
      system: let
        name = "texthooker-ui";
        pkgs = import nixpkgs {inherit system;};
        buildInputs = with pkgs; [nodejs pnpm];
      in {
        # index.html will be located at ./result/lib/node_modules/texthooker-ui/docs/index.html
        packages.default = pkgs.buildNpmPackage {
          inherit name buildInputs;
          src = ./.;
          env = {
            ELECTRON_SKIP_BINARY_DOWNLOAD = "1";
            npm_config_build_from_source = "true";
          };
          npmDepsHash = "sha256-tzbl1sROMh+RU2Q+8lJYr5W3Vkl9SMvjNHv+ycK9pDc=";
          npmBuildScript = "build";
        };

        devShell = pkgs.mkShell {
          inherit buildInputs;
        };
      }
    );
}
