import React, { useEffect, useState } from 'react';
import ParamsSection from '../components/ParamsSection';
import { fetchParams, saveParams } from '../api/params';
import './params.css';

export default function ParamsPage({ isAdmin = false }) {
  const [paramsData, setParamsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchParams();
      setParamsData(data);
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async (newData) => {
    setLoading(true);
    await saveParams(newData);
    setParamsData(newData);
    setEditing(false);
    setLoading(false);
  };

  if (loading) return <div className="params-page">Chargement...</div>;
  if (!paramsData) return <div className="params-page">Aucune donnée.</div>;

  return (
    <div className="params-page">
      <h1>Paramètres</h1>
      {isAdmin && (
        <div className="params-controls">
          <button onClick={() => setEditing(!editing)}>{editing ? 'Annuler' : 'Éditer (admin)'}</button>
          {editing && <button onClick={() => handleSave(paramsData)}>Enregistrer</button>}
        </div>
      )}

      <div className="params-grid">
        <ParamsSection
          title="PASS"
          data={paramsData.pass}
          editable={editing}
          onChange={(d) => setParamsData({ ...paramsData, pass: d })}
        />

        <ParamsSection
          title="Impôt sur le revenu"
          data={paramsData.ir}
          editable={editing}
          onChange={(d) => setParamsData({ ...paramsData, ir: d })}
        />

        <ParamsSection
          title="Assurance vie"
          data={paramsData.assuranceVie}
          editable={editing}
          onChange={(d) => setParamsData({ ...paramsData, assuranceVie: d })}
        />

        <ParamsSection
          title="CEHR"
          data={paramsData.cehr}
          editable={editing}
          onChange={(d) => setParamsData({ ...paramsData, cehr: d })}
        />

        <ParamsSection
          title="IS"
          data={paramsData.is}
          editable={editing}
          onChange={(d) => setParamsData({ ...paramsData, is: d })}
        />

        <ParamsSection
          title="Paramètres sortie capital anciens CT"
          data={paramsData.sortieCapital}
          editable={editing}
          onChange={(d) => setParamsData({ ...paramsData, sortieCapital: d })}
        />

        <ParamsSection
          title="PS"
          data={paramsData.ps}
          editable={editing}
          onChange={(d) => setParamsData({ ...paramsData, ps: d })}
        />
      </div>
    </div>
  );
}
