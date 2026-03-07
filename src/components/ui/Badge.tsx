import { cn } from '@/lib/utils'
import { STAGE_BADGE_STYLES, STAGE_LABELS } from '@/constants/stages'
import type { Stage } from '@/types'

export function StageBadge({ stage }: { stage: Stage }) {
    return (
        <span className={cn(
            'rounded-full px-2.5 py-0.5 text-xs font-medium border',
            STAGE_BADGE_STYLES[stage]
        )}>
            {STAGE_LABELS[stage]}
        </span>
    )
}
