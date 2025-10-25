import React from 'react'
import { useParamsGlobal } from '../context/ParamsProvider.jsx'

const { params: globalParams, loading: gLoading, error: gError, reload } = useParamsGlobal()
useEffect(() => {
  if (globalParams) {
    setForm(prev => ({ ...prev, ...globalParams }))
  }
}, [globalParams])

export default function Params(){
  return (
    <div className="panel">
      <h2>Paramètres</h2>
      <p>Cette page accueillera les données de base de l’onglet <b>Données</b> du classeur.</p>
    </div>
  )
}
