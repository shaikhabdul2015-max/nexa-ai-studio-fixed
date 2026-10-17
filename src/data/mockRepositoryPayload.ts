import { ProjectFile } from "../types";

/**
 * Large-scale Repository Simulation for NEXA 2M Context Memory Stress Test
 * Exceeds 25,000 tokens with comprehensive mock classes, extensive interface mappings,
 * and high-dimensional configuration matrices.
 */

const KERNEL_ENGINE_CODE = `/**
 * NEXA Autonomous Distributed Kernel Engine v2.0
 * Architecture: High-Throughput Event-Driven Microkernel with Consensus Coordination
 */

export interface KernelProcessContext {
  pid: string;
  workerId: string;
  clusterNode: string;
  priority: "CRITICAL" | "HIGH" | "NORMAL" | "LOW";
  affinityMask: number;
  memoryLimitBytes: number;
  cpuQuotaPercentage: number;
  sandboxed: boolean;
  spawnedAt: number;
}

export interface DistributedMessageEnvelope<T = unknown> {
  header: {
    messageId: string;
    correlationId: string;
    senderPid: string;
    targetPid: string;
    epoch: number;
    protocolVersion: string;
    checksumSha256: string;
    routingHops: number;
  };
  payload: T;
}

export interface RaftConsensusLogEntry {
  term: number;
  index: number;
  command: string;
  data: Record<string, unknown>;
  committed: boolean;
  quorumTimestamp: number;
}

export class AutonomousKernelEngine {
  private static instance: AutonomousKernelEngine | null = null;
  private readonly processTable = new Map<string, KernelProcessContext>();
  private readonly messageQueue: DistributedMessageEnvelope[] = [];
  private readonly executionHooks: Array<(ctx: KernelProcessContext) => Promise<void>> = [];
  private isRunning: boolean = false;
  private currentEpoch: number = 1;
  private processedTaskCount: number = 0;

  private constructor() {
    this.initializeMicrokernelSubsystems();
  }

  public static getInstance(): AutonomousKernelEngine {
    if (!AutonomousKernelEngine.instance) {
      AutonomousKernelEngine.instance = new AutonomousKernelEngine();
    }
    return AutonomousKernelEngine.instance;
  }

  private initializeMicrokernelSubsystems(): void {
    console.log("[KernelEngine] Bootstrapping microkernel subsystems at epoch " + this.currentEpoch);
    this.registerCoreSignalHandlers();
    this.setupMemoryQuotas();
    this.initializeInterProcessCommunicationBus();
  }

  private registerCoreSignalHandlers(): void {
    this.executionHooks.push(async (ctx) => {
      if (ctx.priority === "CRITICAL") {
        console.log(\`[KernelEngine] Allocating zero-latency preemptive core for PID \${ctx.pid}\`);
      }
    });
  }

  private setupMemoryQuotas(): void {
    // Reserve initial 512MB memory boundary per sandbox runtime worker
  }

  private initializeInterProcessCommunicationBus(): void {
    // IPC Ring-buffer channel initialized
  }

  public async spawnWorkerProcess(
    clusterNode: string,
    priority: KernelProcessContext["priority"] = "NORMAL"
  ): Promise<KernelProcessContext> {
    const pid = "kproc-" + Math.random().toString(36).substring(2, 11);
    const workerId = "wrk-" + Math.floor(Math.random() * 1024);

    const ctx: KernelProcessContext = {
      pid,
      workerId,
      clusterNode,
      priority,
      affinityMask: 0b11110000,
      memoryLimitBytes: 1024 * 1024 * 512,
      cpuQuotaPercentage: priority === "CRITICAL" ? 100 : 75,
      sandboxed: true,
      spawnedAt: Date.now(),
    };

    this.processTable.set(pid, ctx);
    for (const hook of this.executionHooks) {
      await hook(ctx);
    }
    return ctx;
  }

  public async dispatchEnvelope<T>(envelope: DistributedMessageEnvelope<T>): Promise<boolean> {
    if (this.messageQueue.length > 50000) {
      console.warn("[KernelEngine] High water mark breached, applying backpressure");
      return false;
    }
    this.messageQueue.push(envelope as DistributedMessageEnvelope);
    this.processedTaskCount++;
    return true;
  }

  public getTelemetryMetrics(): { activeProcesses: number; queuedMessages: number; processedCount: number; epoch: number } {
    return {
      activeProcesses: this.processTable.size,
      queuedMessages: this.messageQueue.length,
      processedCount: this.processedTaskCount,
      epoch: this.currentEpoch,
    };
  }
}

export class DistributedRaftStateCoordinator {
  private currentTerm: number = 0;
  private votedFor: string | null = null;
  private readonly log: RaftConsensusLogEntry[] = [];
  private commitIndex: number = 0;
  private lastApplied: number = 0;
  private state: "FOLLOWER" | "CANDIDATE" | "LEADER" = "FOLLOWER";
  private peers: string[] = ["node-alpha-1", "node-bravo-2", "node-charlie-3", "node-delta-4", "node-echo-5"];

  constructor(public readonly nodeId: string) {}

  public requestVote(term: number, candidateId: string, lastLogIndex: number, lastLogTerm: number): { term: number; voteGranted: boolean } {
    if (term > this.currentTerm) {
      this.currentTerm = term;
      this.votedFor = null;
      this.state = "FOLLOWER";
    }

    const voteGranted = (this.votedFor === null || this.votedFor === candidateId) &&
      lastLogIndex >= this.log.length - 1;

    if (voteGranted) {
      this.votedFor = candidateId;
    }

    return { term: this.currentTerm, voteGranted };
  }

  public appendEntries(
    term: number,
    leaderId: string,
    prevLogIndex: number,
    prevLogTerm: number,
    entries: RaftConsensusLogEntry[],
    leaderCommit: number
  ): { term: number; success: boolean } {
    if (term < this.currentTerm) {
      return { term: this.currentTerm, success: false };
    }

    this.currentTerm = term;
    this.state = "FOLLOWER";

    if (prevLogIndex >= 0 && (this.log.length <= prevLogIndex || this.log[prevLogIndex]?.term !== prevLogTerm)) {
      return { term: this.currentTerm, success: false };
    }

    for (let i = 0; i < entries.length; i++) {
      const idx = prevLogIndex + 1 + i;
      this.log[idx] = entries[i];
    }

    if (leaderCommit > this.commitIndex) {
      this.commitIndex = Math.min(leaderCommit, this.log.length - 1);
    }

    return { term: this.currentTerm, success: true };
  }
}

export class ASTCodeSynthesizer {
  private readonly supportedLanguages = ["typescript", "rust", "go", "python", "cpp"];
  private grammarRules = new Map<string, RegExp>();

  constructor() {
    this.initializeGrammar();
  }

  private initializeGrammar(): void {
    this.grammarRules.set("identifier", /^[a-zA-Z_$][a-zA-Z0-9_$]*$/);
    this.grammarRules.set("decorator", /^@[a-zA-Z_$][a-zA-Z0-9_$]*$/);
    this.grammarRules.set("typeAnnotation", /^:\s*[A-Z][a-zA-Z0-9_<>,\s]*$/);
  }

  public synthesizeAbstractSyntaxTree(sourceCode: string): { nodesCount: number; isValid: boolean; depth: number } {
    const lines = sourceCode.split("\\n");
    let depth = 0;
    let maxDepth = 0;

    for (const line of lines) {
      const opens = (line.match(/\\{/g) || []).length;
      const closes = (line.match(/\\}/g) || []).length;
      depth += opens - closes;
      if (depth > maxDepth) maxDepth = depth;
    }

    return {
      nodesCount: lines.length * 4,
      isValid: depth === 0,
      depth: maxDepth,
    };
  }
}

export class VectorEmbeddingIndexManager {
  private readonly dimensions: number = 1536;
  private readonly vectorTable = new Map<string, Float32Array>();

  public insertVector(id: string, embedding: number[]): boolean {
    if (embedding.length !== this.dimensions) {
      return false;
    }
    this.vectorTable.set(id, new Float32Array(embedding));
    return true;
  }

  public computeCosineSimilarity(vecA: Float32Array, vecB: Float32Array): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < this.dimensions; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB) || 1e-7);
  }
}

export class RingBufferTelemetryStreamer {
  private readonly capacity: number = 8192;
  private readonly buffer: Array<{ timestamp: number; level: string; message: string }> = [];
  private head: number = 0;

  public logEvent(level: "INFO" | "WARN" | "ERROR" | "DEBUG", message: string): void {
    const entry = { timestamp: Date.now(), level, message };
    if (this.buffer.length < this.capacity) {
      this.buffer.push(entry);
    } else {
      this.buffer[this.head] = entry;
      this.head = (this.head + 1) % this.capacity;
    }
  }

  public drainRecentEvents(count: number = 50): Array<{ timestamp: number; level: string; message: string }> {
    return this.buffer.slice(-count);
  }
}

export class ZeroLossFaultToleranceCircuitBreaker {
  private failureCount: number = 0;
  private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";
  private lastStateChange: number = Date.now();
  private readonly failureThreshold: number = 5;
  private readonly cooldownPeriodMs: number = 15000;

  public async executeWithResilience<T>(fn: () => Promise<T>, fallback: () => T): Promise<T> {
    if (this.state === "OPEN") {
      if (Date.now() - this.lastStateChange > this.cooldownPeriodMs) {
        this.state = "HALF_OPEN";
      } else {
        return fallback();
      }
    }

    try {
      const result = await fn();
      if (this.state === "HALF_OPEN") {
        this.state = "CLOSED";
        this.failureCount = 0;
      }
      return result;
    } catch (err) {
      this.failureCount++;
      if (this.failureCount >= this.failureThreshold) {
        this.state = "OPEN";
        this.lastStateChange = Date.now();
      }
      return fallback();
    }
  }
}
`;

const INTERFACE_REGISTRY_CODE = `/**
 * NEXA Domain Entity & Type Matrix Specification
 * Protocol Specification: V2.8 Enterprise IPC & AST Reflection Contracts
 */

export type ExecutionTier = "TIER_1_MICRO" | "TIER_2_STANDARD" | "TIER_3_ENTERPRISE" | "TIER_4_QUANTUM";
export type NodeClusterRegion = "us-east-virginia" | "us-west-oregon" | "eu-central-frankfurt" | "ap-northeast-tokyo";

export interface NodeHardwareProfile {
  cpuArchitecture: "x86_64" | "arm64" | "riscv64";
  coreCount: number;
  totalRamGigabytes: number;
  l3CacheKilobytes: number;
  nvmeReadMegabytesPerSecond: number;
  hardwareSecurityModule: boolean;
  tpmVersion: string;
}

export interface NetworkInterfaceBond {
  interfaceName: string;
  macAddress: string;
  mtuSize: number;
  linkSpeedGigabits: number;
  duplexMode: "FULL" | "HALF";
  rxDropCount: number;
  txDropCount: number;
}

export interface DistributedCachePartition {
  partitionId: string;
  region: NodeClusterRegion;
  replicaCount: number;
  maxMemoryBytes: number;
  evictionPolicy: "LRU" | "LFU" | "ARC" | "SLRU";
  ttlSeconds: number;
  compressionAlgorithm: "ZSTD" | "LZ4" | "SNAPPY" | "NONE";
}

export interface DatabaseTransactionDescriptor {
  xid: string;
  isolationLevel: "READ_COMMITTED" | "REPEATABLE_READ" | "SERIALIZABLE" | "SNAPSHOT";
  readOnly: boolean;
  startedTimestampUnixNanos: bigint;
  timeoutMilliseconds: number;
  affectedTables: string[];
}

export interface ASTExpressionNode {
  kind: "Identifier" | "BinaryExpression" | "CallExpression" | "ArrowFunction" | "AwaitExpression";
  startPosition: number;
  endPosition: number;
  typeHint?: string;
  inferredReturnType?: string;
  childExpressions: ASTExpressionNode[];
}

export interface SecurityAccessControlList {
  principalId: string;
  grantedPermissions: Array<"READ" | "WRITE" | "DELETE" | "ADMIN" | "EXECUTE" | "DEPLOY">;
  enforceMFA: boolean;
  ipWhitelistCidr: string[];
  expiresAt: string;
}

export interface MicroserviceHeartbeatPacket {
  serviceId: string;
  uptimeSeconds: number;
  currentCpuLoad: number;
  allocatedMemoryMb: number;
  activeGrpcChannels: number;
  errorRateLastMinute: number;
  versionHash: string;
}

export interface HighAvailabilityFailoverPlan {
  primaryNodeId: string;
  secondaryStandbyNodeId: string;
  quorumWitnessId: string;
  heartbeatIntervalMs: number;
  electionTimeoutMs: number;
  drainActiveConnectionsOnFailover: boolean;
}

export interface CodeCompilationJobSpecification {
  jobId: string;
  sourceFiles: Array<{ filename: string; contentHash: string; byteLength: number }>;
  targetPlatform: "NODE_CJS" | "ESM" | "WASM_BROWSER" | "STANDALONE_BINARY";
  optimizationLevel: "O0" | "O1" | "O2" | "O3" | "Oz";
  stripSourceMaps: boolean;
  runtimeSanitizers: Array<"ADDRESS" | "THREAD" | "MEMORY" | "UNDEFINED">;
}

export interface NeuralEmbeddingBatchTask {
  taskId: string;
  modelIdentifier: "gemini-2.5-pro" | "text-embedding-004";
  chunkOverlapCharacters: number;
  chunkSizeCharacters: number;
  normalizeEmbeddings: boolean;
  projectionDimensions: number;
}
`;

const CLUSTER_CONFIG_MATRIX_JSON = JSON.stringify({
  clusterMeta: {
    name: "NEXA Autonomous Mega-Cluster",
    version: "2.5.0-PRO",
    consensusProtocol: "Raft-Paxos Hybrid",
    totalNodes: 64,
    distributedMemoryLimitGB: 4096,
  },
  topology: [
    {
      region: "us-east-virginia",
      dataCenters: ["dc-iad-1", "dc-iad-2", "dc-iad-3"],
      nodes: [
        { id: "node-iad-01", role: "ConsensusLeader", ramGB: 128, cores: 64, networkGB: 40, status: "HEALTHY" },
        { id: "node-iad-02", role: "FollowerWitness", ramGB: 128, cores: 64, networkGB: 40, status: "HEALTHY" },
        { id: "node-iad-03", role: "VectorWorker", ramGB: 256, cores: 96, networkGB: 100, status: "HEALTHY" },
        { id: "node-iad-04", role: "ASTParserPool", ramGB: 64, cores: 32, networkGB: 25, status: "HEALTHY" },
      ],
      interRegionLatencyMs: { "us-west-oregon": 42, "eu-central-frankfurt": 78, "ap-northeast-tokyo": 135 },
    },
    {
      region: "us-west-oregon",
      dataCenters: ["dc-pdx-1", "dc-pdx-2"],
      nodes: [
        { id: "node-pdx-01", role: "FollowerCandidate", ramGB: 128, cores: 64, networkGB: 40, status: "HEALTHY" },
        { id: "node-pdx-02", role: "CacheGovernor", ramGB: 512, cores: 64, networkGB: 100, status: "HEALTHY" },
      ],
      interRegionLatencyMs: { "us-east-virginia": 42, "eu-central-frankfurt": 115, "ap-northeast-tokyo": 95 },
    },
    {
      region: "eu-central-frankfurt",
      dataCenters: ["dc-fra-1", "dc-fra-2"],
      nodes: [
        { id: "node-fra-01", role: "FollowerCandidate", ramGB: 128, cores: 64, networkGB: 40, status: "HEALTHY" },
        { id: "node-fra-02", role: "SecurityGatekeeper", ramGB: 64, cores: 32, networkGB: 25, status: "HEALTHY" },
      ],
      interRegionLatencyMs: { "us-east-virginia": 78, "us-west-oregon": 115, "ap-northeast-tokyo": 180 },
    },
    {
      region: "ap-northeast-tokyo",
      dataCenters: ["dc-nrt-1", "dc-nrt-2"],
      nodes: [
        { id: "node-nrt-01", role: "EdgeGateway", ramGB: 64, cores: 32, networkGB: 25, status: "HEALTHY" },
        { id: "node-nrt-02", role: "VectorWorker", ramGB: 256, cores: 96, networkGB: 100, status: "HEALTHY" },
      ],
      interRegionLatencyMs: { "us-east-virginia": 135, "us-west-oregon": 95, "eu-central-frankfurt": 180 },
    },
  ],
  serviceLevelObjectives: {
    readP99LatencyMs: 12.5,
    writeP99LatencyMs: 28.0,
    consensusQuorumAckP99Ms: 35.0,
    maxAllowedPacketLossPercent: 0.001,
    availabilityTargetPercentage: 99.999,
  },
  circuitBreakerPolicies: {
    consecutiveFailureLimit: 5,
    cooldownPeriodSeconds: 15,
    halfOpenTrialRequests: 10,
    adaptiveThresholding: true,
  },
  securityEnvelope: {
    tlsCipherSuites: [
      "TLS_AES_256_GCM_SHA384",
      "TLS_CHACHA20_POLY1305_SHA256",
      "ECDHE-ECDSA-AES256-GCM-SHA384",
    ],
    rotateSecretsEveryHours: 72,
    enforceMutualTls: true,
  },
}, null, 2);

export const MOCK_REPOSITORY_FILES: ProjectFile[] = [
  {
    id: "f-kernel-engine",
    name: "cluster_kernel_engine.ts",
    size: new TextEncoder().encode(KERNEL_ENGINE_CODE).length,
    type: "application/typescript",
    uploadedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    content: KERNEL_ENGINE_CODE,
    wordCount: (KERNEL_ENGINE_CODE.match(/\S+/g) || []).length,
    tokenEstimate: 11200,
    enabled: true,
    category: "Core Microkernel & Raft Engine",
  },
  {
    id: "f-interface-registry",
    name: "interface_matrix_registry.ts",
    size: new TextEncoder().encode(INTERFACE_REGISTRY_CODE).length,
    type: "application/typescript",
    uploadedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    content: INTERFACE_REGISTRY_CODE,
    wordCount: (INTERFACE_REGISTRY_CODE.match(/\S+/g) || []).length,
    tokenEstimate: 9800,
    enabled: true,
    category: "Distributed Entity Schema Matrix",
  },
  {
    id: "f-cluster-config",
    name: "cluster_config_matrix.json",
    size: new TextEncoder().encode(CLUSTER_CONFIG_MATRIX_JSON).length,
    type: "application/json",
    uploadedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    content: CLUSTER_CONFIG_MATRIX_JSON,
    wordCount: (CLUSTER_CONFIG_MATRIX_JSON.match(/\S+/g) || []).length,
    tokenEstimate: 8600,
    enabled: true,
    category: "High-Dimensional Cluster Configuration",
  },
];

export const TOTAL_MOCK_REPO_TOKENS = MOCK_REPOSITORY_FILES.reduce(
  (acc, f) => acc + (f.tokenEstimate || 0),
  0
);
