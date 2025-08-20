import 'package:flutter/material.dart';
import 'package:konto/features/jars/collaborators/presentation/views/invite_collaborators_view.dart';

void main() {
  // Test if we can access Contact and InviteCollaboratorsSheet
  Contact contact = Contact(name: 'test', phoneNumber: '123', initials: 'T');
  print(contact.name);

  InviteCollaboratorsSheet sheet = InviteCollaboratorsSheet();
  print(sheet.toString());
}
