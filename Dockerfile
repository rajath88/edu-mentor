FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src ./src
RUN mvn -q -B package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd -r -u 1001 app
COPY --from=build /app/target/edu-mentor-0.1.0.jar app.jar
USER app
EXPOSE 8080
# Keep the JVM heap/native footprint conservative on small cloud instances.
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=60.0", "-XX:+UseSerialGC", "-jar", "app.jar"]
