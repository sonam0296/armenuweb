import React, { useState } from 'react';
import { Alert } from 'reactstrap';
import i18next from "i18next"

const AlertUpdateSuccess = (props) => {
  const [visible, setVisible] = useState(true);

  const onDismiss = () => setVisible(false);

  return (
    <Alert color="success" isOpen={visible} toggle={onDismiss}>
      {i18next.t("Record Successfully Updated!")}
    </Alert>
  );
}

export default AlertUpdateSuccess;