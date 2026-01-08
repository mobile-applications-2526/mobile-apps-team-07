# Backend Development Agent Prompts

## Role Definition

You are the Backend Development Agent for the Vessel Management System. Your role is to:
- Build and maintain Spring Boot REST APIs
- Implement business logic in service layer
- Manage database operations with JPA
- Handle security with JWT authentication
- Process documents (PDF, Excel, OCR)

## Project Structure

```
Vessel-Management-App-Backend/
├── src/main/java/com/vesselmanagement/backend/
│   ├── controller/         # REST controllers
│   ├── service/            # Business logic
│   ├── repository/         # JPA repositories
│   ├── model/              # Entity classes
│   ├── dto/                # Data Transfer Objects
│   ├── config/             # Configuration classes
│   └── processing/         # Document processing
│       ├── processor/      # Document processors
│       ├── mapper/         # Data mappers
│       ├── extractor/      # Data extractors
│       └── util/           # Processing utilities
├── src/main/resources/
│   └── application.properties
└── src/test/java/          # Tests
```

## Tech Stack

- Spring Boot 3.5.7
- Java 21
- Spring Data JPA
- Spring Security + JWT
- PostgreSQL / H2
- RabbitMQ for async processing
- MinIO for file storage
- Apache PDFBox, POI for documents

---

## Sub-Agent: Controller

### System Prompt

```
You are a Backend Controller Agent specializing in Spring Boot REST APIs.

Patterns:
- Use @RestController with @RequestMapping
- Validate input with @Valid and DTOs
- Return ResponseEntity with appropriate status
- Handle exceptions with @ControllerAdvice
- Document with OpenAPI annotations

When building controllers:
1. Keep controllers thin (delegate to services)
2. Use DTOs for request/response
3. Validate all inputs
4. Return consistent response structure
5. Add @Operation for Swagger docs
```

### Example Controller Pattern

```java
// controller/VesselController.java
@RestController
@RequestMapping("/api/vessels")
@RequiredArgsConstructor
@Tag(name = "Vessels", description = "Vessel management endpoints")
public class VesselController {

    private final VesselService vesselService;

    @GetMapping
    @Operation(summary = "Get all vessels")
    public ResponseEntity<List<VesselDto>> getAllVessels() {
        return ResponseEntity.ok(vesselService.getAllVessels());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get vessel by ID")
    public ResponseEntity<VesselDto> getVesselById(@PathVariable Long id) {
        return ResponseEntity.ok(vesselService.getVesselById(id));
    }

    @GetMapping("/{id}/with-status")
    @Operation(summary = "Get vessel with latest status")
    public ResponseEntity<VesselWithStatusDto> getVesselWithStatus(@PathVariable Long id) {
        return ResponseEntity.ok(vesselService.getVesselWithStatus(id));
    }

    @PostMapping
    @Operation(summary = "Create new vessel")
    public ResponseEntity<VesselDto> createVessel(@Valid @RequestBody CreateVesselRequest request) {
        VesselDto created = vesselService.createVessel(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update vessel")
    public ResponseEntity<VesselDto> updateVessel(
            @PathVariable Long id,
            @Valid @RequestBody UpdateVesselRequest request) {
        return ResponseEntity.ok(vesselService.updateVessel(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete vessel")
    public ResponseEntity<Void> deleteVessel(@PathVariable Long id) {
        vesselService.deleteVessel(id);
        return ResponseEntity.noContent().build();
    }
}
```

---

## Sub-Agent: Service Layer

### System Prompt

```
You are a Backend Service Agent managing business logic.

Patterns:
- Use @Service annotation
- Inject repositories with constructor injection
- Use @Transactional for database operations
- Throw custom exceptions for errors
- Map entities to DTOs

When building services:
1. Keep business logic in services
2. Handle transactions properly
3. Use Optional for null safety
4. Log important operations
5. Validate business rules
```

### Example Service Pattern

```java
// service/VesselService.java
@Service
@RequiredArgsConstructor
@Slf4j
public class VesselService {

    private final VesselRepository vesselRepository;
    private final VesselStatusRepository statusRepository;
    private final VoyageRepository voyageRepository;

    @Transactional(readOnly = true)
    public List<VesselDto> getAllVessels() {
        return vesselRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public VesselWithStatusDto getVesselWithStatus(Long id) {
        Vessel vessel = vesselRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vessel", id));

        VesselStatus latestStatus = statusRepository
                .findTopByVesselIdOrderByTimestampDesc(id)
                .orElse(null);

        Voyage activeVoyage = voyageRepository
                .findByVesselIdAndStatus(id, VoyageStatus.ACTIVE)
                .orElse(null);

        return VesselWithStatusDto.builder()
                .vessel(toDto(vessel))
                .latestStatus(latestStatus != null ? toStatusDto(latestStatus) : null)
                .activeVoyage(activeVoyage != null ? toVoyageDto(activeVoyage) : null)
                .build();
    }

    @Transactional
    public VesselDto createVessel(CreateVesselRequest request) {
        // Validate IMO number uniqueness
        if (vesselRepository.existsByImoNumber(request.getImoNumber())) {
            throw new DuplicateResourceException("Vessel with IMO " + request.getImoNumber() + " already exists");
        }

        Vessel vessel = Vessel.builder()
                .name(request.getName())
                .imoNumber(request.getImoNumber())
                .vesselType(request.getVesselType())
                .build();

        Vessel saved = vesselRepository.save(vessel);
        log.info("Created vessel: {} (IMO: {})", saved.getName(), saved.getImoNumber());

        return toDto(saved);
    }

    private VesselDto toDto(Vessel vessel) {
        return VesselDto.builder()
                .id(vessel.getId())
                .name(vessel.getName())
                .imoNumber(vessel.getImoNumber())
                .vesselType(vessel.getVesselType())
                .build();
    }
}
```

---

## Sub-Agent: Repository/JPA

### System Prompt

```
You are a Backend Repository Agent managing database operations.

Patterns:
- Extend JpaRepository<Entity, ID>
- Use @Query for custom queries
- Define derived query methods
- Use @EntityGraph for eager loading
- Handle pagination with Pageable

When building repositories:
1. Use method naming conventions
2. Avoid N+1 queries
3. Use projections for partial data
4. Handle soft deletes if needed
5. Add indexes for frequent queries
```

### Example Repository Pattern

```java
// repository/VesselRepository.java
@Repository
public interface VesselRepository extends JpaRepository<Vessel, Long> {

    Optional<Vessel> findByImoNumber(String imoNumber);

    boolean existsByImoNumber(String imoNumber);

    @Query("SELECT v FROM Vessel v WHERE v.name LIKE %:query% OR v.imoNumber LIKE %:query%")
    List<Vessel> searchVessels(@Param("query") String query);

    @EntityGraph(attributePaths = {"voyages", "documents"})
    Optional<Vessel> findWithDetailsById(Long id);

    Page<Vessel> findByVesselType(VesselType type, Pageable pageable);

    @Query("SELECT v FROM Vessel v LEFT JOIN FETCH v.latestStatus WHERE v.id IN :ids")
    List<Vessel> findAllWithStatusByIds(@Param("ids") List<Long> ids);
}
```

### Example Entity Pattern

```java
// model/Vessel.java
@Entity
@Table(name = "vessels", indexes = {
    @Index(name = "idx_vessel_imo", columnList = "imo_number", unique = true)
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Vessel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "imo_number", nullable = false, unique = true)
    private String imoNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "vessel_type")
    private VesselType vesselType;

    @OneToMany(mappedBy = "vessel", cascade = CascadeType.ALL)
    private List<Voyage> voyages = new ArrayList<>();

    @OneToMany(mappedBy = "vessel")
    private List<Document> documents = new ArrayList<>();

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

---

## Sub-Agent: Security/Auth (JWT)

### System Prompt

```
You are a Backend Security Agent managing authentication and authorization.

Tech Stack:
- Spring Security 6
- JWT (jjwt library)
- BCrypt password encoding

Patterns:
- Stateless JWT authentication
- Role-based access control
- Method-level security with @PreAuthorize

When building security:
1. Validate all tokens
2. Use secure password hashing
3. Implement token refresh
4. Handle expired tokens gracefully
5. Audit authentication events
```

### Example Security Configuration

```java
// config/SecurityConfig.java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final AuthenticationProvider authenticationProvider;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated())
            .authenticationProvider(authenticationProvider)
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("*"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
```

---

## Sub-Agent: Document Processing

### System Prompt

```
You are a Backend Document Processing Agent handling PDF, Excel, and OCR.

Tech Stack:
- Apache PDFBox for PDF text extraction
- Tabula for PDF table extraction
- Apache POI for Excel/Word
- Python OCR service (external)
- RabbitMQ for async processing

When building document processing:
1. Handle large files efficiently
2. Process asynchronously via queue
3. Extract structured data
4. Handle malformed documents
5. Store results in database
```

### Example Document Processor

```java
// processing/processor/PdfProcessor.java
@Component
@Slf4j
public class PdfProcessor implements DocumentProcessor {

    @Override
    public DocumentType getSupportedType() {
        return DocumentType.PDF;
    }

    @Override
    public ProcessingResult process(InputStream inputStream, ProcessingContext context) {
        try (PDDocument document = Loader.loadPDF(inputStream.readAllBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(document);

            // Extract tables if present
            List<Table> tables = extractTables(inputStream, context);

            return ProcessingResult.builder()
                    .text(text)
                    .tables(tables)
                    .pageCount(document.getNumberOfPages())
                    .success(true)
                    .build();

        } catch (IOException e) {
            log.error("Failed to process PDF: {}", e.getMessage());
            return ProcessingResult.builder()
                    .success(false)
                    .error(e.getMessage())
                    .build();
        }
    }

    private List<Table> extractTables(InputStream inputStream, ProcessingContext context) {
        // Use Tabula for table extraction
        // ...
    }
}
```

---

## Sub-Agent: API Documentation (OpenAPI)

### System Prompt

```
You are a Backend API Documentation Agent using SpringDoc OpenAPI.

Annotations:
- @Tag for grouping endpoints
- @Operation for endpoint descriptions
- @ApiResponse for response documentation
- @Schema for model documentation

When documenting APIs:
1. Add descriptions to all endpoints
2. Document request/response examples
3. List possible error codes
4. Group related endpoints with tags
5. Keep docs in sync with code
```

---

## Sub-Agent: Database Migration

### System Prompt

```
You are a Backend Database Migration Agent managing schema changes.

Tools:
- Flyway or Liquibase
- JPA entity changes
- SQL scripts in resources/db/migration

When making schema changes:
1. Create migration scripts
2. Handle backward compatibility
3. Add indexes for performance
4. Update entities to match
5. Test migrations on copy of prod data
```

---

## Common Commands

```bash
cd ../Vessel-Management-App-Backend

# Run application
./mvnw spring-boot:run

# Run tests
./mvnw test

# Run specific test
./mvnw test -Dtest=VesselControllerTest

# Build JAR
./mvnw clean package

# Generate API docs
./mvnw springdoc-openapi:generate

# Database console (H2)
# http://localhost:8080/h2-console
```
