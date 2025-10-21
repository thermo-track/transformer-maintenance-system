import os
import subprocess
from dotenv import load_dotenv

# Load credentials from .env
load_dotenv("docker_cred.env")

DOCKER_USERNAME = os.getenv("DOCKER_USERNAME")
DOCKER_PASSWORD = os.getenv("DOCKER_PASSWORD")

# Map local images to Docker Hub tags
IMAGES_TO_PUSH = [
    {
        "local": "tms-frontend:local",
        "remote": f"{DOCKER_USERNAME}/tms-frontend:latest",
    },
    {
        "local": "tms-backend-application-tms-backend:latest",
        "remote": f"{DOCKER_USERNAME}/tms-backend:latest",
    },
    {
        "local": "tms-fault-detection-model-inference-api:latest",
        "remote": f"{DOCKER_USERNAME}/tms-inference-api:latest",
    },
]


def run_command(command, input_data=None):
    """Helper function to execute shell commands"""
    try:
        result = subprocess.run(
            command, 
            shell=True, 
            check=True,
            input=input_data,
            text=True,
            capture_output=True
        )
        return True, result.stdout
    except subprocess.CalledProcessError as e:
        return False, e.stderr if hasattr(e, 'stderr') else str(e)


def login_to_docker():
    if not DOCKER_USERNAME or not DOCKER_PASSWORD:
        print("⚠️ Missing Docker username or password in docker_cred.env. Skipping login...")
        return False

    print(f"\n🔐 Logging into Docker Hub as {DOCKER_USERNAME}")
    
    command = f'docker login -u "{DOCKER_USERNAME}" --password-stdin'
    
    success, output = run_command(command, input_data=DOCKER_PASSWORD)
    
    if success:
        print("✅ Docker login successful!")
        return True
    else:
        print(f"❌ Docker login failed: {output}")
        return False


def tag_and_push_image(local_tag, remote_tag):
    print(f"\n🏷️  Tagging image: {local_tag} -> {remote_tag}")
    success, output = run_command(f"docker tag {local_tag} {remote_tag}")
    
    if not success:
        print(f"❌ Failed to tag image: {output}")
        return False

    print(f"🚀 Pushing Docker image: {remote_tag}...")
    success, output = run_command(f"docker push {remote_tag}")
    
    if not success:
        print(f"❌ Failed to push image: {output}")
        return False
    
    print(f"✅ Successfully tagged and pushed: {remote_tag}")
    return True


def main():
    print("=" * 60)
    print("🐳 Docker Image Push Script")
    print("=" * 60)
    
    # Login to Docker
    if not login_to_docker():
        print("\n❌ Push process aborted due to login failure.")
        return

    # Tag and push each image
    all_success = True
    for image in IMAGES_TO_PUSH:
        success = tag_and_push_image(image["local"], image["remote"])
        if not success:
            all_success = False

    print("\n" + "=" * 60)
    if all_success:
        print("✅ All images tagged and pushed successfully!")
        print("\nYour images are now available at:")
        for image in IMAGES_TO_PUSH:
            print(f"  📦 {image['remote']}")
    else:
        print("⚠️ Some images failed to push. Check the errors above.")
    print("=" * 60)


if __name__ == "__main__":
    main()
