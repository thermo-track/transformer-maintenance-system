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

    // Work Data Sheet fields
    // Time & Supervision Section
    private String startTime;
    private String completionTime;
    private String supervisedBy;
    
    // Gang Composition Section
    private String techI;
    private String techII;
    private String techIII;
    private String helpers;
    
    // Inspection & Rectification Log Section
    private String inspectedByWds;
    private String inspectedDate;
    private String rectifiedBy;
    private String rectifiedDate;
    private String reInspectedBy;
    private String reInspectedDate;
    private String cssPerson;
    private String cssDate;
    
    // Final Verification Section
    private String finalCssPerson;
    private String finalCssDate;

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
