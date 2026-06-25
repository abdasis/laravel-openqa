export type Severity = 'critical' | 'warning' | 'info';

export type UseCaseOutcome = 'success' | 'ui_bug' | 'incomplete' | 'skipped' | string;

export interface TraceStep {
    step_number?: number;
    step_type?: 'action' | 'wait' | 'assert' | string;
    action?: string;
    result?: string;
    wait_note?: string;
}

export interface FormField {
    field_name: string;
    input_type?: string;
    is_required?: boolean;
}

export interface FormObserved {
    url?: string;
    fields?: FormField[];
    submit_disabled_when?: string;
}

export interface UseCase {
    name: string;
    outcome?: UseCaseOutcome;
    defect_summary?: string;
    success_signal?: string;
    data_created?: string;
    why_incomplete?: string;
    why_skipped?: string;
    blocked_by?: string;
    trace?: TraceStep[];
    forms_observed?: FormObserved[];
}

export interface PageVisited {
    name: string;
    url?: string;
    purpose?: string;
    key_ui_elements?: string[];
}

export interface ExplorerData {
    module?: string;
    feature?: string;
    description?: string;
    base_url?: string;
    use_cases?: UseCase[];
    pages_visited?: PageVisited[];
    app_observations?: string[];
    status?: string;
    counters?: Record<string, number>;
}

export interface Finding {
    severity: Severity;
    title: string;
    actual?: string;
    expected?: string;
    recommendation?: string;
}

export interface IndexData {
    module?: string;
    feature?: string;
    findings?: Finding[];
    recommendations?: string[];
    summary?: Record<string, number>;
}

export interface ModuleSummary {
    slug: string;
    module: string;
    feature: string | null;
    status: string | null;
    counters: Record<string, number>;
    summary: Record<string, number>;
}

export interface FeatureSummaryItem {
    slug: string;
    feature: string;
    page: string | null;
    summary: Record<string, number>;
}

export interface ActiveModule {
    slug: string;
    explorer: ExplorerData | null;
    index: IndexData | null;
    features: FeatureSummaryItem[];
}

/**
 * Isi satu file sub-fitur (mis. categories.json). Menggabungkan bentuk
 * explorer (use_cases) dan index (findings/recommendations/summary).
 */
export interface FeatureData extends ExplorerData {
    page?: string;
    findings?: Finding[];
    recommendations?: unknown[];
    summary?: Record<string, number>;
}

export interface E2ePageProps {
    root: string | null;
    modules: ModuleSummary[];
    active: ActiveModule | null;
    activeFeatureSlug: string | null;
    activeFeature: FeatureData | null;
    [key: string]: unknown;
}
