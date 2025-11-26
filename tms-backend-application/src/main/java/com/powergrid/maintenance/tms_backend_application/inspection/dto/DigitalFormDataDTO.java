package com.powergrid.maintenance.tms_backend_application.inspection.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.List;

@Data
public class DigitalFormDataDTO {
    private String inspectionId;
    private String inspectedBy;
    private String baselineRight;
    private String baselineLeft;
    private String baselineFront;
    private String lastMonthKVA;
    private String lastMonthDate;
    private String lastMonthTime;
    private String currentMonthKVA;
    private String baselineCondition;
    private String meterSerial;
    private String meterCTRatio;
    private String meterMake;
    private List<ChecklistItemDTO> checklist;
    private String afterThermalDate;
    private String afterThermalTime;
    private InspectionReadingsDTO firstInspection;
    private InspectionReadingsDTO secondInspection;

    @Data
    public static class ChecklistItemDTO {
        private Integer no;
        private Boolean c;
        private Boolean cl;
        private Boolean t;
        private Boolean r;
        private String other;
        private Boolean ok;
        private Boolean notOk;
        private String irNos;
    }

    @Data
    public static class InspectionReadingsDTO {
        @JsonProperty("vR")
        private String vR;
        
        @JsonProperty("vY")
        private String vY;
        
        @JsonProperty("vB")
        private String vB;
        
        @JsonProperty("iR")
        private String iR;
        
        @JsonProperty("iY")
        private String iY;
        
        @JsonProperty("iB")
        private String iB;
    }
}
