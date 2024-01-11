#-*-coding: utf-8-*-
import sys
from pydicom import dcmread

class DicomService:

    def get_patient_info(self, dataset):
        """
        환자 정보 가져오기
        * 환자 정보: patientId, patientName, PatientAge, PatientSex
        * CT 정보: studyDate, studyTime, studyDescription
        """
        patient_dict = dict()
        patientId = dataset.get("PatientID")
        patientName = dataset.get("PatientName")
        studyDate = dataset.get("StudyDate")
        studyTime = dataset.get("StudyTime")
        studyDescription = dataset.get("StudyDescription")
        sex = dataset.get("PatientSex")
        age = dataset.get("PatientAge")

        if patientId is not None:
            patient_dict['patientId'] = str(patientId)
        else:
            patient_dict['patientId'] = None
        if patientName is not None:
            patient_dict['patientName'] = str(patientName)
        else:
            patient_dict['patientName'] = None
        if studyDate is not None:
            patient_dict['studyDate'] = studyDate
        else:
            patient_dict['studyDate'] = None
        if studyTime is not None:
            patient_dict['studyTime'] = studyTime
        else:
            patient_dict["studyTime"] = None
        if studyDescription is not None:
            patient_dict['studyDescription'] = str(studyDescription)
        else:
            patient_dict["studyDescription"] = None
        if sex is not None:
            patient_dict['sex'] = str(sex)
        else:
            patient_dict['sex'] = None
        if age is not None:
            patient_dict['age'] = str(age)
        else:
            patient_dict['age'] = None

        return patient_dict

    def get_dataset(self, file_path):
        """파일 데이터셋을 읽어옴"""
        try:
            dataset = dcmread(file_path, force=True)
            return dataset
        except Exception as e:
            sys.stderr.write('An error occurs in "get dataset"')
            sys.exit(1)

    def del_tag_group(self, dataset, tag_group):
        """데이터셋 내 태그 그룹 제거"""
        try:
            for element in dataset:
                if element.tag.group == int(tag_group, 16):
                    del dataset[element.tag]
            return dataset
        except Exception as e:
            sys.stderr.write('An error occurs in "delete tag group in dataset"')
            sys.exit(1)
    
    def anonymize_dataset(self, dataset):
        """
        다이콤 헤더 익명화
        * private_tags 제거
        * tag group: 0x0010
        * Study Date, Study 
        """
        try:
            if("StudyDate") in dataset:
                delattr(dataset, "StudyDate") 
            if("StudyTime") in dataset:
                delattr(dataset, "StudyTime")            
            dataset.remove_private_tags()
            for element in dataset:
                if element.tag.group == 0x0010:
                    element.value = None
                if element.VR == 'PN':
                    element.value = None
            return dataset
        except Exception as e:
            sys.stderr.write('An error occurs in "anonymize dataset"')
            sys.exit(1)

    def pseudonymize_dataset(self, dataset, pseudo_value):
        """
        다이콤 헤더 가명화
        * 가명화 대상: dataset; PatientID, PatientName
        * 가명화 값: pseudo_value
        """
        try:
            dataset.PatientID = pseudo_value
            dataset.PatientName = pseudo_value
            return dataset
        except Exception as e:
            sys.stderr.write('An error occurs in "pseudomize dataset"')
            sys.exit(1)

    def append_private_creator(self, dataset):
        """private creator 지정"""
        try:
            block = dataset.private_block(0x0019, 'Referenced Instance UID', create=True)
            studyInstanceUID = dataset.get("StudyInstanceUID")
            seriesInstanceUID = dataset.get("SeriesInstanceUID")
            sopInstanceUID = dataset.get("SOPInstanceUID")
            if studyInstanceUID is not None:
                block.add_new(0x01, 'UI', studyInstanceUID)
            if seriesInstanceUID is not None:
                block.add_new(0x02, 'UI', seriesInstanceUID)
            if sopInstanceUID is not None:
                block.add_new(0x03, 'UI', sopInstanceUID)
            return dataset
        except Exception as e:
            sys.stderr.write('An error occurs in "append private_creator"')
            sys.exit(1)

    def reset_uid(self, dataset):
        """UID 재설정"""
        try:
            studyInstanceUID = dataset.get("StudyInstanceUID")
            seriesInstanceUID = dataset.get("SeriesInstanceUID")
            sopInstanceUID = dataset.get("SOPInstanceUID")
            if studyInstanceUID is not None:
                dataset.StudyInstanceUID = '1.2.410.200108.1{}'.format(studyInstanceUID[16:])
            if seriesInstanceUID is not None:
                dataset.SeriesInstanceUID = '1.2.410.200108.1{}'.format(seriesInstanceUID[16:])
            if sopInstanceUID is not None:
                dataset.SOPInstanceUID = '1.2.410.200108.1{}'.format(sopInstanceUID[16:])
            return dataset       
        except Exception as e:
            sys.stderr.write('An error occurs in "reset UID"')    
            sys.exit(1) 
