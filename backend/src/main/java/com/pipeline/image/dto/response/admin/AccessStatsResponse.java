package com.pipeline.image.dto.response.admin;

import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
public class AccessStatsResponse {
    private List<AccessLog> hourly;
    private List<AccessLog> daily;
    private List<AccessLog> monthly;
    private long totalAccess;
    private long todayAccess;

    @Getter
    @Setter
    public static class AccessLog {
        private String timestamp;
        private long count;

        public AccessLog(String timestamp, long count) {
            this.timestamp = timestamp;
            this.count = count;
        }
    }
}
