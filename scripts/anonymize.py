# -*-coding: utf-8-*-
import os, sys
from util.file_service import FileService
from util.dicom_service import DicomService


class Anonymize:
    __fileService = None
    __dicomService = None

    __huId = None
    __filename = None
    __src_filepath = None
    __tmp_dir = None

    def __init__(self, filepath, huId):
        """
        :param filepath:    업로드된 파일 경로(임시 파일명) {PWD}/data/dicom/temp/tmp-${Date.now()}-${Math.round(Math.random() * 1E9)}.zip
        :param dest_filepath:   저장할 파일 경로 {PWD}/data/dicom/{huId}/{huId}.zip
        :param huId:            huId
        """
        # 가명화 값
        self.__huId = huId
        self.__filename = huId
        self.__src_filepath = filepath
        self.__tmp_dir = os.path.abspath(os.path.join(filepath, "..", "..", huId, huId))

        self.__fileService = FileService()
        self.__dicomService = DicomService()

    def start_service(self):
        try:
            # 압축 해제
            self.__fileService.unzipfile(self.__src_filepath, self.__tmp_dir)
            # 압축 파일 제거
            self.__fileService.remove_file(self.__src_filepath)
            for root, dirs, files in os.walk(self.__tmp_dir, topdown=False):
                # 데이터셋 가명화
                for file_name in files:
                    # 데이터셋 가져오기
                    file_path = os.path.join(root, file_name)
                    try:
                        dataset = self.__dicomService.get_dataset(file_path)
                    except:
                        continue
                    finally:
                        # 원본 파일 제거
                        self.__fileService.remove_file(file_path)
                    
                    # 1. dataset에 file_meta에 관련한 태그(0x0002)가 포함된 경우 제거
                    del_dataset = self.__dicomService.del_tag_group(dataset, '0x0002')
                    # 2. 익명화
                    anonym_dataset = self.__dicomService.anonymize_dataset(del_dataset)
                    # 3. 다이콤 가명화
                    pseudo_dataset = self.__dicomService.pseudonymize_dataset(anonym_dataset, self.__huId)
                    # 4. 원본 UID를 private_creator에 추가
                    private_dataset = self.__dicomService.append_private_creator(pseudo_dataset)
                    # 5. Hutom UID로 변경
                    uid_dataset = self.__dicomService.reset_uid(private_dataset)

                    # 시리즈 폴더 생성
                    series_dir = self.__fileService.get_series_dir(self.__tmp_dir, uid_dataset)
                    if not os.path.isdir(series_dir):
                        os.makedirs(series_dir, exist_ok=True)

                    # 가명화 파일 저장
                    instance_dir = os.path.join(series_dir, uid_dataset.get("SOPInstanceUID", "UNKNOWN"))
                    uid_dataset.save_as(instance_dir, write_like_original=True)

                # 빈 폴더 제거
                for dir_name in dirs:
                    dir_path = os.path.join(root, dir_name)
                    if len(os.listdir(dir_path)) < 1:
                        os.rmdir(dir_path)
                    
            # 디렉토리 정보 가져오기; 시리즈 개수, 인스턴스 개수
            dir_info = self.__fileService.get_dir_info(self.__tmp_dir)

            # 전체 파일 압축하기
            storage_dir = os.path.abspath(os.path.join(self.__tmp_dir, ".."))
            zipfile_path = self.__fileService.archive_zipfile(self.__tmp_dir, storage_dir, self.__filename)

            # 압축 해제로 생성된 원본 폴더 제거
            self.__fileService.remove_dir(self.__tmp_dir)

            if dir_info:
                # 스터디 정보 전달
                study_info = {
                    "filePath": zipfile_path,
                    **dir_info,
                }
                print(study_info)
                sys.exit(0)
            else:
                sys.stderr.write('Invalid DICOM')
                sys.exit(9)
        except Exception as e:
            sys.stderr.write(str(e))
            sys.exit(1)


def main():
    filepath = sys.argv[1]
    huId = sys.argv[2]

    anonymize = Anonymize(filepath, huId)
    anonymize.start_service()


if __name__ == "__main__":
    main()
