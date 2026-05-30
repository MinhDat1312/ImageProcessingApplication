FROM gradle:8.14.2-jdk21 AS build
WORKDIR /app
COPY build.gradle ./
RUN gradle --no-daemon dependencies
COPY src ./src
RUN gradle clean build -x test --no-daemon
RUN cp $(find /app/build/libs -maxdepth 1 -name '*-0.0.1-SNAPSHOT.jar' ! -name '*-plain.jar' | head -n 1) /app/image-app.jar

FROM eclipse-temurin:21-jdk-alpine
WORKDIR /app
COPY --from=build /app/image-app.jar image-app.jar
EXPOSE 4000
ENTRYPOINT ["java", "-jar", "image-app.jar"]