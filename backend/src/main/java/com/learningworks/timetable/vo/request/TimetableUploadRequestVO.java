package com.learningworks.timetable.vo.request;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class TimetableUploadRequestVO {
    private MultipartFile file;
}
