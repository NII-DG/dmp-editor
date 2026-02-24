import { KakenApiClient } from "@hirakinii-packages/kaken-api-client-typescript"
import type { Project } from "@hirakinii-packages/kaken-api-client-typescript"
import { useQuery } from "@tanstack/react-query"

import type { ProjectInfo } from "@/dmp"

/**
 * Maps a KAKEN API Project object to a DMP ProjectInfo object.
 * @param project - KAKEN Project data
 * @returns Partial DMP ProjectInfo mapped from the KAKEN project
 */
export function kakenProjectToDmpProjectInfo(project: Project): ProjectInfo {
  const allocation = project.allocations?.[0]
  const period = project.periodOfAward

  return {
    fundingAgency: allocation?.name ?? "",
    programName: allocation?.name ?? "",
    programCode: allocation?.code ?? "",
    projectCode: project.awardNumber ?? "",
    projectName: project.title ?? "",
    adoptionYear: period?.startFiscalYear != null ? String(period.startFiscalYear) : "",
    startYear: period?.startFiscalYear != null ? String(period.startFiscalYear) : "",
    endYear: period?.endFiscalYear != null ? String(period.endFiscalYear) : "",
  }
}

/**
 * Custom hook for searching KAKEN projects by project number and mapping them to DMP ProjectInfo.
 * Uses `enabled: false` so the query only runs when `refetch()` is called manually.
 * File-based caching is disabled (`useCache: false`) since it is not available in browser environments.
 * @param kakenNumber - KAKEN project number (e.g. "23K12345")
 */
export function useKakenProject(kakenNumber: string) {
  return useQuery<ProjectInfo | null, Error>({
    queryKey: ["kakenProject", kakenNumber],
    queryFn: async () => {
      const client = new KakenApiClient({ useCache: false })
      const response = await client.projects.search({ projectNumber: kakenNumber })
      const project = response.projects[0]
      if (!project) return null
      return kakenProjectToDmpProjectInfo(project)
    },
    enabled: false,
  })
}
