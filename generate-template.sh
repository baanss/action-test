#!/bin/bash

# Setting folder paths
current_dir=$(pwd)
# parent_dir=$(dirname "$current_dir")
folder_path="$current_dir"

# Function: Modify .env.template files
modify_env_template() {
    local folder_path="$1"
    local service_code="$2"

    local env_template_paths=(
        "$folder_path/integration/.env.template"
        "$folder_path/production/.env.template"
    )

    for env_template_path in "${env_template_paths[@]}"; do
        if [ -f "$env_template_path" ]; then
            # Modify sed command for compatibility with MacOS
            if [[ "$OSTYPE" == "darwin"* ]]; then
                sed -i '' "s/^SERVICE_CODE=.*/SERVICE_CODE=$service_code/" "$env_template_path"
            else
                sed -i "s/^SERVICE_CODE=.*/SERVICE_CODE=$service_code/" "$env_template_path"
            fi
            echo "SERVICE_CODE in $env_template_path updated to '$service_code'"
        else
            echo "Error: .env.template file not found in $env_template_path"
        fi
    done
}

# Function: Delete specific files within folders
delete_specific_files() {
    local folder_path="$1"
    local files_to_delete=(
        "$folder_path/generate-template.sh"
        "$folder_path/.git"
    )

    for file in "${files_to_delete[@]}"; do
        if [ -e "$file" ]; then  
            if [ -d "$file" ]; then  
                rm -rf "$file"  
                echo "Deleted directory: $file"
            else  
                rm -f "$file"
                echo "Deleted file: $file"
            fi
        fi
    done
}


# Function: Compress folders
compress_folder() {
    local folder_path="$1"
    local new_folder_name="$2"
    local zip_filename="$3"
    local zip_path="$folder_path/$zip_filename"

    cd "$folder_path" || exit

    # Compress folders to zip files from the folder directory
    zip -r "$zip_path.zip" "$new_folder_name" >/dev/null
    echo "Folder compressed to '$zip_path.zip'"
}

# Set folder names and command-line arguments
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <Service_Code> <Tag>"
    exit 1
fi

service_code="$1" # 첫 번째 argument를 Service Code로 설정
# tag="$2" # 두 번째 argument를 Tag로 설정

# refs/tags/ 부분을 제거하여 순수한 태그명 추출
tag_ref="${2#refs/tags/}"
tag="$tag_ref" # 추출된 순수한 태그명을 tag 변수에 저장

new_folder_name="h-server-setting-$service_code-$tag"

# Copy folders
cp -r "$current_dir" "$folder_path/$new_folder_name"
echo "Folder copied to '$folder_path/$new_folder_name'"

# Modify .env.template files
modify_env_template "$folder_path/$new_folder_name" "$service_code"

# Delete specific files within folders
delete_specific_files "$folder_path/$new_folder_name"

# Compress folders
compress_folder "$folder_path" "$new_folder_name" "$new_folder_name"

# Delete copied directory after compression
rm -rf "$folder_path/$new_folder_name"
echo "Copied directory '$new_folder_name' deleted."