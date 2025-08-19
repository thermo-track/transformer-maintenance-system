import { useEffect, useMemo, useState } from 'react';
import { REGION_OPTIONS, TYPE_OPTIONS } from '../constants.js';
import { useMetaOptions } from '../hooks.js';

export default function TransformerForm({ mode = 'create', initial = null, onSubmit, submitting }) {
const [values, setValues] = useState(() => ({
transformerNo: initial?.transformerNo || '',
poleNo: initial?.poleNo || '',
region: initial?.region || 'CENTRAL',
type: initial?.type || 'DISTRIBUTION',
locationDetails: initial?.locationDetails || ''
}));


const { data: meta } = useMetaOptions(REGION_OPTIONS, TYPE_OPTIONS);
const regions = meta?.regions || REGION_OPTIONS;
const types = meta?.types || TYPE_OPTIONS;


useEffect(() => {
if (initial) {
setValues(v => ({
...v,
transformerNo: initial.transformerNo || '',
poleNo: initial.poleNo || '',
region: initial.region || 'CENTRAL',
type: initial.type || 'DISTRIBUTION',
locationDetails: initial.locationDetails || ''
}));
}
}, [initial]);


const disabledFields = useMemo(() => ({
transformerNo: mode === 'edit' // unique; usually not editable
}), [mode]);


function handleChange(e) {
const { name, value } = e.target;
setValues(v => ({ ...v, [name]: value }));
}


function submit(e) {
e.preventDefault();
const payload = { ...values };
if (mode === 'edit') {
// On update, backend ignores nulls; we only send editable fields
delete payload.transformerNo;
}
onSubmit(payload);
}

return (
<form onSubmit={submit} className="grid cols-2" style={{gap:'1rem'}}>
<div>
<label className="label">Transformer No *</label>
<input className="input" name="transformerNo" value={values.transformerNo}
onChange={handleChange} disabled={disabledFields.transformerNo} required />
</div>
<div>
<label className="label">Pole No *</label>
<input className="input" name="poleNo" value={values.poleNo}
onChange={handleChange} required />
</div>


<div>
<label className="label">Region *</label>
<select className="select" name="region" value={values.region} onChange={handleChange}>
{regions.map(r => (
<option key={r} value={r}>{r}</option>
))}
</select>
</div>
<div>
<label className="label">Type *</label>
<select className="select" name="type" value={values.type} onChange={handleChange}>
{types.map(t => (
<option key={t} value={t}>{t}</option>
))}
</select>
</div>


<div className="grid cols-2" style={{gridColumn:'1 / -1'}}>
<div style={{gridColumn:'1 / -1'}}>
<label className="label">Location details</label>
<textarea className="textarea" rows={3} name="locationDetails"
value={values.locationDetails} onChange={handleChange} />
</div>
</div>


<div className="actions" style={{gridColumn:'1 / -1'}}>
<button className="btn" type="button" onClick={() => history.back()}>Cancel</button>
<button className="btn primary" disabled={submitting}>
{submitting ? 'Saving…' : (mode === 'create' ? 'Create' : 'Save changes')}
</button>
</div>
</form>
);
}