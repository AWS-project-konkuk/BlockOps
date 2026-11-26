import { MachineActivity } from './MachineActivity';
import { NumberActivity } from './NumberActivity';
import { ReleaseScene } from './SimulationScenes';
import { StorageActivity } from './StorageActivity';
import { VirtualActivity } from './VirtualActivity';
import { ScenarioScene, StructureScene } from './Visual';

export const dedicatedActivities = {
  machine: MachineActivity,
  virtual: VirtualActivity,
  storage: StorageActivity,
};

export const simulationScenes = {
  numbers: NumberActivity,
  release: ReleaseScene,
  structure: StructureScene,
  scenario: ScenarioScene,
};
