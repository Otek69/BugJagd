import { useState } from 'react';
import { runActual } from '../../core/grading/proof';
import type { Exercise, RawInput } from '../../core/types';

interface Props {
  exercise: Exercise;
  input: RawInput;
  onInputChange: (input: RawInput) => void;
}

export function MiniAppPanel({ exercise, input, onInputChange }: Props) {
  const [output, setOutput] = useState<unknown>(null);
  const View = exercise.app.View;
  return (
    <section className="panel testobject" aria-labelledby="app-heading">
      <h2 id="app-heading">Testobjekt (Test Object): {exercise.app.title}</h2>
      <p className="field-help">
        {exercise.app.description} Dieses Programm enthält die versteckten Fehler.
      </p>
      <div className="testobject-frame">
        <View
          params={exercise.appParams}
          input={input}
          onInputChange={onInputChange}
          output={output}
          onRun={() => setOutput(runActual(exercise, input))}
        />
      </div>
    </section>
  );
}
