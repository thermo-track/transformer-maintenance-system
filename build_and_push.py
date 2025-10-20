import os
import subprocess
from dotenv import load_dotenv

# Load credentials from .env
load_dotenv("docker_cred.env")

DOCKER_USERNAME = os.getenv("DOCKER_USERNAME")
DOCKER_PASSWORD = os.getenv("DOCKER_PASSWORD")


DOCKER_IMAGES = [
    {
        "context": "./tms-frontend-application",
        "dockerfile": "Dockerfile",
        "tag": f"{DOCKER_USERNAME}/tms-frontend:latest",
    },
    {
        "context": "./tms-backend-application",
        "dockerfile": "Dockerfile",
        "tag": f"{DOCKER_USERNAME}/tms-backend:latest",
    },
    {
        "context": "./phase2_fault_type",
        "dockerfile": "Dockerfile",
        "tag": f"{DOCKER_USERNAME}/tms-inference-api:latest",
    },
]


def run_command(command, suppress_output=False, input_data=None):
    """Helper function to execute shell commands"""
    try:
        if suppress_output:
            result = subprocess.run(
                command,
                shell=True,
                check=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                input=input_data,
                text=True
            )
        else:
            result = subprocess.run(
                command, 
                shell=True, 
                check=True,
                input=input_data,
                text=True
            )
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error executing command: {e}")
        return False


def login_to_docker():
    if not DOCKER_USERNAME or not DOCKER_PASSWORD:
        print("⚠️ Missing Docker username or password in docker_cred.env. Skipping login...")
        return False

    print(f"\n🔐 Logging into Docker Hub as {DOCKER_USERNAME}")
    
    # Use stdin input instead of echo pipe for Windows compatibility
    command = f'docker login -u "{DOCKER_USERNAME}" --password-stdin'
    
    try:
        result = subprocess.run(
            command,
            shell=True,
            check=True,
            input=DOCKER_PASSWORD,
            text=True,
            capture_output=True
        )
        print("✅ Docker login successful!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Docker login failed: {e}")
        print(f"Error output: {e.stderr if hasattr(e, 'stderr') else 'No error details'}")
        return False


def build_and_push_image(context, dockerfile, tag):
    print(f"\n📦 Building Docker image: {tag} (No Cache)...")
    success = run_command(f"docker build --no-cache -t {tag} -f {context}/{dockerfile} {context}")
    
    if not success:
        print(f"❌ Failed to build image: {tag}")
        return False

    print(f"🚀 Pushing Docker image: {tag}...")
    success = run_command(f"docker push {tag}")
    
    if not success:
        print(f"❌ Failed to push image: {tag}")
        return False
    
    print(f"✅ Successfully built and pushed: {tag}")
    return True


def main():
    # Login to Docker
    if not login_to_docker():
        print("\n❌ Build process aborted due to login failure.")
        return

    # Build and push each image
    all_success = True
    for image in DOCKER_IMAGES:
        success = build_and_push_image(image["context"], image["dockerfile"], image["tag"])
        if not success:
            all_success = False

    if all_success:
        print("\n✅ All images built and pushed successfully!")
    else:
        print("\n⚠️ Some images failed to build or push. Check the errors above.")


if __name__ == "__main__":
    main()
