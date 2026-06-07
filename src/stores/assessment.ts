import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import type { AnswerLevel } from '@/types/valos';

export interface OperatorProfile {
  orgType?: 'curious' | 'solo' | 'small-team' | 'organization' | 'enterprise';
  validatorCount?: 'under-10' | '10-100' | '100-1000' | 'over-1000';
  infra?: 'cloud' | 'bare-metal' | 'hybrid' | 'managed';
  keyMgmt?: 'hot-wallet' | 'hardware-wallet' | 'hsm' | 'mpc';
  teamSize?: 'solo' | '2-5' | '6-20' | 'over-20';
}

export const useAssessmentStore = defineStore(
  'assessment',
  () => {
    const profile = ref<OperatorProfile>({});
    const answers = ref<Record<string, AnswerLevel>>({});
    // Operator-confirmed Not Applicable risk IDs (stored as an array for JSON serialisation)
    const _naRisksArr = ref<string[]>([]);
    // Control IDs the operator has marked as implemented (array for JSON serialisation)
    const _implementedArr = ref<string[]>([]);
    const _version = ref<number>(3);

    // Reactive Set derived from the array (for O(1) membership checks)
    const naRisks = computed(() => new Set(_naRisksArr.value));
    const implemented = computed(() => new Set(_implementedArr.value));

    function setProfileField<K extends keyof OperatorProfile>(key: K, value: OperatorProfile[K]): void {
      profile.value[key] = value;
    }

    function setAnswer(riskId: string, level: AnswerLevel): void {
      // If a risk had been answered and is now being set N/A via this path, clear N/A
      answers.value[riskId] = level;
    }

    function setNotApplicable(riskId: string): void {
      if (!_naRisksArr.value.includes(riskId)) {
        _naRisksArr.value = [..._naRisksArr.value, riskId];
      }
      // Clear any existing answer when marking N/A
      delete answers.value[riskId];
    }

    function clearNotApplicable(riskId: string): void {
      _naRisksArr.value = _naRisksArr.value.filter((id) => id !== riskId);
    }

    function setImplemented(controlId: string, on: boolean): void {
      if (on) {
        if (!_implementedArr.value.includes(controlId)) {
          _implementedArr.value = [..._implementedArr.value, controlId];
        }
      } else {
        _implementedArr.value = _implementedArr.value.filter((id) => id !== controlId);
      }
    }

    function reset(): void {
      profile.value = {};
      answers.value = {};
      _naRisksArr.value = [];
      _implementedArr.value = [];
      _version.value = 3;
    }

    return {
      profile,
      answers,
      _naRisksArr,
      _implementedArr,
      naRisks,
      implemented,
      _version,
      setProfileField,
      setAnswer,
      setNotApplicable,
      clearNotApplicable,
      setImplemented,
      reset,
    };
  },
  {
    persist: {
      key: 'valos-explorer:v1',
      afterRestore: (ctx) => {
        // Forward-migrate older blobs without wiping the operator's answers.
        const v = ctx.store._version;
        if (v === 1) {
          // v1 had no _naRisksArr and no _implementedArr
          if (!ctx.store._naRisksArr) ctx.store._naRisksArr = [];
          if (!ctx.store._implementedArr) ctx.store._implementedArr = [];
          ctx.store._version = 3;
        } else if (v === 2) {
          // v2 had _naRisksArr but no implemented tracker
          if (!ctx.store._implementedArr) ctx.store._implementedArr = [];
          ctx.store._version = 3;
        } else if (v === 3) {
          if (!ctx.store._implementedArr) ctx.store._implementedArr = [];
        } else {
          ctx.store.reset();
        }
      },
    },
  }
);
