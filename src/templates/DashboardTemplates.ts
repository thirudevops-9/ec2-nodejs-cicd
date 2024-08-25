export const successAdminAuditorRegistration = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta content="width=device-width, initial-scale=1" name="viewport">
    <title>OTP Verification Request</title>
  </head>
  <body>
    <p>Dear {{userName}},</p>
    <p>Your {{role}} profile is active now.</p>
    <p>Please use the following link to sign in <a href="{{dashboardURL}}">{{dashboardURL}}.</a></p>
    <p>Regards,<br/>
      Steigen Healthcare <br/>
      This is system generated email. Do not reply to this mail. If you need any support, write to <a href="mailto:info@thito.in">info@thito.in</a></p>
    </body>
  </body>
</html>
`;

export const complaintReply = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta content="width=device-width, initial-scale=1" name="viewport">
    <title>Grievence Report</title>
  </head>
  <body>
   <p>Dear {{name}},</p>
   <p>{{admin_reply}}</p>
   <p>Regards,<br/>
    Steigen Healthcare <br/>
    This is system generated email. Do not reply to this mail. If you need any support, write to <a href="mailto:info@thito.in">info@thito.in</a></p>
  </body>
</html>
`;

export const AutocomplaintReply = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta content="width=device-width, initial-scale=1" name="viewport">
    <title>Grievence Report</title>
  </head>
  <body>
   <p>Dear {{name}},</p>
   <p>Thanks for contacting THITO. Your complaint No. is {{complaintId}}. We will respond shortly to resolve the
   issue. Please use the complaint number for future correspondence on this complaint. </p>  
   <p>Regards,<br/>
    Steigen Healthcare <br/>
    This is system generated email. Do not reply to this mail. If you need any support, write to <a href="mailto:info@thito.in">info@thito.in</a></p>
  </body>
</html>
`;
export const otp_verification_dashboardUsers = `
<!DOCTYPE >
<html>
 <head>
  <meta charset="UTF-8">
  <meta content="width=device-width, initial-scale=1" name="viewport">
  
  <title>OTP verification </title>
 </head>
  <body>
    <p>Dear {{firstName}},</p>

    <p>To create new profile on THITO, OTP is {{data}}, it is valid for 15 minutes. Do not share the OTP.</p>

      <p>Regards,<br/>
      Steigen Healthcare <br/>
      This is system generated email. Do not reply to this mail. If you need any support, write to <a href="mailto:info@thito.in">info@thito.in</a></p>
    
  </body>
</html>
`;

export const otp_verification_dashboardUsers_login = `
<!DOCTYPE >
<html>
 <head>
  <meta charset="UTF-8">
  <meta content="width=device-width, initial-scale=1" name="viewport">
  
  <title>OTP verification </title>
 </head>
  <body>
    <p>Dear {{firstName}},</p>

    <p>To Log into the THITO portal, please enter OTP {{data}}. Do not share the OTP.</p>

    <p>Regards,<br/>
      Steigen Healthcare<br/>
      This is system generated email. Do not reply to this mail. If you need any support, write to <a href="mailto:info@thito.in">info@thito.in</a></p>
  </body>
    
  </body>
</html>
`;
