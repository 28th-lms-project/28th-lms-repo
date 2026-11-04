package com.learningworks.course.vo.response;

public class CourseVO {
	private String id;
	private String courseName;
	private String no;
	private String startDate;
	private String endDate;
	
	public String getId() {
		return id;
	}
	public void setId(String id) {
		this.id = id;
	}
	public String getCourseName() {
		return courseName;
	}
	public void setCourseName(String courseName) {
		this.courseName = courseName;
	}
	public String getNo() {
		return no;
	}
	public void setNo(String no) {
		this.no = no;
	}
	public String getStartDate() {
		return startDate;
	}
	public void setStartDate(String startDate) {
		this.startDate = startDate;
	}
	public String getEndDate() {
		return endDate;
	}
	public void setEndDate(String endDate) {
		this.endDate = endDate;
	}
	@Override
	public String toString() {
		return "CourseVO [id=" + id + ", courseName=" + courseName + ", no=" + no + ", startDate=" + startDate
				+ ", endDate=" + endDate + "]";
	}
	
	
	
	
}
