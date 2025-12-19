import './Spinner.css';

export function Spinner() {
  return (
    <div className="pv-loading">
      <div className="pv-spinner">
        <div className="pv-spinner-ring" />
        <div className="pv-spinner-ring" />
        <div className="pv-spinner-ring" />
        <div className="pv-spinner-ring" />
        <div className="pv-spinner-ring" />
        <div className="pv-spinner-ring" />
        <div className="pv-spinner-ring" />
        <div className="pv-spinner-ring" />
      </div>
    </div>
  );
}
