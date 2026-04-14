package com.pipeline.image.aspect;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class StageLoggingAspect {
    private static final Logger log = LoggerFactory.getLogger(StageLoggingAspect.class);

    @Pointcut("execution(* com.pipeline.image.core.ImageStage+.process(..))")
    public void imageStageProcess() {
    }

    @Around("imageStageProcess()")
    public Object logStageExecutionTime(ProceedingJoinPoint joinPoint) throws Throwable {
        long startTime = System.currentTimeMillis();

        try {
            return joinPoint.proceed();
        } finally {
            long executionTimeMs = System.currentTimeMillis() - startTime;
            String stageName = joinPoint.getTarget().getClass().getSimpleName();
            log.info("{} took {}ms to execute.", stageName, executionTimeMs);
        }
    }
}
