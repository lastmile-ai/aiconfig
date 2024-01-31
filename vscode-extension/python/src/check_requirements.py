import argparse
import pkg_resources
from packaging import version
import re
import sys


# Read requirements.txt and construct the required packages dictionary as package_name: version
def split_pkg_ver_spec(line):
    """
    Splits the package name and package version (if any)
    e.g. "numpy==1.18.5" -> ["numpy", "==1.18.5"], "=="
    """
    version_specifiers = ["==", "!=", "<=", ">=", "<", ">"]

    for spec in version_specifiers:
        if spec in line:
            return line.split(spec, 1), spec

    return [line], None


def load_requirements(requirements_txt_path: str):
    required_packages = {}
    with open(requirements_txt_path, "r") as file:
        for line in file:
            # Strip comments and white space
            line = re.sub(r" #.*", "", line).strip()
            if line and not line.startswith("#"):
                pkg_ver_spec, spec = split_pkg_ver_spec(line)
                package_name = pkg_ver_spec[0]
                package_ver = (
                    pkg_ver_spec[1] if len(pkg_ver_spec) > 1 else None
                )

                print(
                    f"pkg_ver_spec: {pkg_ver_spec}, Package: {package_name}, Version: {package_ver}, Spec: {spec}"
                )
                required_packages[package_name.lower()] = package_ver, spec

    return required_packages


def check_packages(packages):
    for package, ver_spec in packages.items():
        try:
            print(f"Checking {package}...")
            dist = pkg_resources.get_distribution(package)
            installed_version = version.parse(dist.version)

            print(
                f"Installed version: {installed_version}, Required version: {ver_spec}"
            )

            if ver_spec and ver_spec[0]:
                expected_version = version.parse(ver_spec[0])
                spec = ver_spec[1]
                test = f"'{installed_version}' {spec} '{expected_version}'"
                print(f"Test: {test}, eval(test)= {eval(test)}")
                if not eval(test):
                    print(
                        f"{package} has version {installed_version}, but expected {spec}{expected_version}"
                    )
                    return False
            print(f"{package} ({installed_version}) is installed")
        except pkg_resources.DistributionNotFound:
            print(f"{package} is NOT installed")
            return False
    return True


parser = argparse.ArgumentParser()
parser.add_argument(
    "--requirements_path",
    type=str,
    required=True,
    help="Path to requirements.txt file",
)
args = parser.parse_args()

# Load the requirements.txt
requirements_txt_path = args.requirements_path
required_packages = load_requirements(requirements_txt_path)

# Check the required packages
are_packages_installed = check_packages(required_packages)
if not are_packages_installed:
    sys.exit(1)
else:
    sys.exit(0)
