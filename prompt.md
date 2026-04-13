You are a senior full-stack software architect and developer.

Design and implement a complete full-stack Image Processing Pipeline System using Pipeline Architecture Style.

The system must include both Frontend (React) and Backend (Spring Boot Java).

-------------------------------------

SYSTEM OVERVIEW

Build an image processing web application where users upload images and the system processes them through a pipeline of stages.

Each stage performs one transformation on the image, and the image flows sequentially through all stages.

Pipeline stages must include:

1. Input Stage
2. Resize Stage
3. Filter Stage
4. Watermark Stage
5. Compression Stage
6. Output Stage

The pipeline must be modular and allow adding or removing stages easily.

-------------------------------------

ARCHITECTURE REQUIREMENTS

Use Pipeline Architecture Style.

Each stage must:

- Be implemented as an independent component/class
- Accept an image as input
- Return the processed image as output
- Have only one responsibility

Use the following pipeline sequence:

Input → Resize → Filter → Watermark → Compression → Output

Backend should dynamically build pipeline based on user request.

-------------------------------------

BACKEND REQUIREMENTS

Technology Stack:

- Java 17+
- Spring Boot
- REST API
- Multipart file upload
- BufferedImage / ImageIO
- Gradle
- Lombok
- Optional: Thumbnailator library

Backend Responsibilities:

1. Receive uploaded image
2. Validate file format (JPEG, PNG)
3. Execute image processing pipeline
4. Return processed image
5. Store processed image locally
6. Generate URL for processed image

-------------------------------------

PIPELINE DESIGN

Create:

Interface:

ImageStage

Method:

BufferedImage process(BufferedImage input)

Each stage must implement ImageStage.

Pipeline manager:

ImagePipeline

Must:

- Maintain list of stages
- Execute them sequentially
- Allow dynamic stage registration

-------------------------------------

FILTER REQUIREMENTS

Support:

- grayscale
- sepia
- brightness adjustment

Allow multiple filters.

-------------------------------------

WATERMARK REQUIREMENTS

Support:

- Text watermark
- Custom position
- Adjustable size

-------------------------------------

COMPRESSION REQUIREMENTS

Support:

- JPEG compression
- Adjustable quality (0.1 – 1.0)

-------------------------------------

FRONTEND REQUIREMENTS

Technology Stack:

- React
- TypeScript
- Axios
- Ant Design UI

Frontend Features:

1. Upload image
2. Select resize dimensions
3. Choose filter
4. Enter watermark text
5. Select compression level
6. Submit processing request
7. Display processed image
8. Download processed image

ImagePreview

Display:

- Original image
- Processed image

UI DESIGN

Use Ant Design components:

Upload
Input
Select
Slider
Button
Card
Image

Layout:

Two-column layout:

Left:
Form controls

Right:
Image preview

-------------------------------------

STORAGE REQUIREMENTS

Store processed images:

Local folder:

/processed-images

Generate accessible URLs.

-------------------------------------

OPTIONAL ADVANCED FEATURES

If possible, also implement:

1. Dynamic pipeline configuration
Allow enabling/disabling stages.

2. Parallel processing support

3. Upload multiple images

4. Pipeline execution time measurement

5. Download processed image button

-------------------------------------

DELIVERABLES

Provide:

1. Complete Backend Source Code
2. Complete Frontend Source Code
3. API documentation
4. Pipeline class diagram
5. Component diagram
6. Sample requests
7. README with setup instructions

-------------------------------------

CODING STYLE

- Follow clean architecture
- Use SOLID principles
- Add meaningful comments
- Use consistent naming
- Make code production-quality

-------------------------------------

IMPORTANT

Generate:

- Full working backend code
- Full working frontend code
- Example configuration
- Example requests

Ensure code is modular, readable, and extensible.

-------------------------------------

OUTPUT FORMAT

Organize output into sections:

1. Backend Implementation
2. Frontend Implementation
3. API Documentation
4. Architecture Diagrams (text-based)
5. How to Run the System

Do not skip any sections.