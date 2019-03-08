
export const SET_PROJECTID = 'SET_PROJECTID';
export const SET_PLATFORM = 'SET_PLATFORM';
export const SET_PROJECTID_SUCCESS = 'SET_PROJECTID_SUCCESS';


export function setProjectId (projectId) {
  return {
    type: 'SET_PROJECTID',
    payload: projectId
  }
}

export function setPlatform (platform) {
  return {
    type: 'SET_PLATFORM',
    payload: platform
  }
}
