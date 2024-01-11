#-*-coding: utf-8-*-
import os, shutil, sys, re
from zipfile import ZipFile, ZIP_DEFLATED

class FileService:
    my_ip = os.environ.get('HOST', '0.0.0.0')
    my_port = int(os.environ.get('PORT', '5000'))

    def unzipfile(self, src_path, dest_path):
        """압축 파일 추출"""
        try:
            with ZipFile(src_path, 'r') as zip_ref:
                zip_ref.extractall(dest_path)
        except Exception as e:
            sys.stderr.write('An error occurs in "unzipfile"')
            sys.exit(9)
    
    def remove_file(self, file_path):
        """파일 제거"""
        try:
            if os.path.isfile(file_path):
                os.remove(file_path)
        except Exception as e:
            sys.stderr.write('An error occurs in "remove file"')
            sys.exit(1)

    def remove_dir(self, dir_path):
        """파일을 포함한 폴더 제거"""
        try:
            if os.path.isdir(dir_path):
                shutil.rmtree(dir_path)
        except Exception as e:
            sys.stderr.write('An error occurs in "remove directory"')
            sys.exit(1)

    def get_dir_info(self, dir_path) -> dict:
        """
        폴더 정보 가져오기
        * 파일 개수: seriesCount, instancesCount
        :param dir_path: 조회할 폴더 경로
        :return dict: { seriesCount: int, instancesCount: int }
        """
        dir_info = dict()
        instance_list = list()
        # 시리즈 리스트; dir_path의 하위 디렉토리 리스트
        series_list = next(os.walk(dir_path))[1]
        # 인스턴스 리스트; 파일 리스트
        for _, _, files in os.walk(dir_path):
            for file in files:
                instance_list.append(file)
        dir_info['seriesCount'] = len(series_list)
        dir_info['instancesCount'] = len(instance_list)
        if not instance_list:
            sys.stderr.write('No DICOM file to anonymize ' + dir_path)
            sys.exit(9)
        return dir_info

    def get_series_dir(self, base_dir, dataset):
        """시리즈 폴더 경로"""
        # 하위 폴더명; 시리즈(e.g. 7_pp__1mm)
        series_number = dataset.get("SeriesNumber", "000")
        series_description = dataset.get("SeriesDescription", "unknown").lower()
        replace_series_description = re.sub('[^a-z0-9]', '_', series_description)

        series_name = "{}_{}".format(series_number, replace_series_description)
        series_dir = os.path.join(base_dir, series_name)
        return series_dir
        
    def archive_zipfile(self, src_dir, dest_dir, filename) -> str:
        """
        압축 파일 생성
        :param src_dir:     압축할 폴더 경로    {PWD}/data/dicom/{huId}
        :param dest_dir:    저장할 압축파일 경로    {PWD}/data/dicom
        :param filename:    압축 파일명     filename(wo/ext)
        :return str:        압축 파일 경로
        """
        try:
            # 현재 working directory
            owd = os.getcwd()
            # 압축파일을 생성할 working directory로 이동
            os.chdir(dest_dir)
            dest_filepath = os.path.join(dest_dir, "{}.zip".format(filename))

            # 아카이브 파일 쓰기
            zip_file = ZipFile(dest_filepath, 'w')
            for path, dirs, files in os.walk(src_dir):
                for file in files:
                    rel_path = os.path.relpath(path, dest_dir)
                    file_path = os.path.join(rel_path, file)
                    zip_file.write(file_path, compress_type=ZIP_DEFLATED)
            zip_file.close()
            os.chdir(owd)
            return dest_filepath
        except Exception as e:
            sys.stderr.write('An error occurs in "archive zipfile"')
            sys.exit(1)