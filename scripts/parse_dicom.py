# -*-coding: utf-8-*-
import os, sys
from util.file_service import FileService
from util.dicom_service import DicomService

class ParseDicom:
    __src_filepath = None
    __patient_info = dict()

    def __init__(self, filepath, huId):
        """
        :param src_filepath:    업로드된 파일 경로(임시 파일명) {PWD}/data/dicom/temp/tmp-${Date.now()}-${Math.round(Math.random() * 1E9)}.zip
        :param huId: huId
        """
        self.__src_filepath = filepath
        self.__temp_dir = os.path.abspath(os.path.join(filepath, "..", "..", huId, "temp"))

        self.__fileService = FileService()
        self.__dicomService = DicomService()

    def start_service(self):
        try:
            self.__fileService.unzipfile(self.__src_filepath, self.__temp_dir)
            for root, dirs, files in os.walk(self.__temp_dir, topdown=False):
                if self.__patient_info.get("patientId") is not None:
                    break
                for file_name in files:
                    file_path = os.path.join(root, file_name)
                    try:
                        dataset = self.__dicomService.get_dataset(file_path)
                        self.__patient_info = self.__dicomService.get_patient_info(dataset)
                        if self.__patient_info.get("patientId") is None:
                            continue
                        break
                    except:
                        continue
            self.__fileService.remove_dir(self.__temp_dir)
            if self.__patient_info.get("patientId") is not None:
                print(self.__patient_info)
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

    parseDicom = ParseDicom(filepath, huId)
    parseDicom.start_service()


if __name__ == "__main__":
    main()
