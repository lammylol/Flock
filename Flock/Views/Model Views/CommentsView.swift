// CommentsView.swift
// Flock 
//
// provides the UI for viewing and adding comments
//
// Created by Ramon Jiang 09/011/24

import SwiftUI

struct CommentsView: View {
    let postID: String
    var isInSheet: Bool
    @Binding var viewModel: CommentViewModel
    
    @State private var newCommentText = ""
    @FocusState private var isCommentFieldFocused: Bool
    @Environment(UserProfileHolder.self) var userHolder
    @Environment(\.presentationMode) var presentationMode
    
    @State private var viewModelUpdateCounter = 0
    
    var body: some View {
        VStack (alignment: .leading, spacing: 15) {
            commentsList
            errorView
            commentInputField
        }
        .task {
            print("CommentsView task started for post \(postID)")
            await fetchCommentsIfNeeded()
        }
        .onChange(of: postID) { newID in
            print("PostID changed to: \(newID)")
            Task {
                await fetchCommentsIfNeeded()
            }
        }
        .onChange(of: newCommentText) {
            viewModel.scrollToEnd = true
        }
    }

    private func fetchCommentsIfNeeded() async {
        guard !postID.isEmpty else {
            print("PostID is empty, not fetching comments")
            return
        }
        await viewModel.fetchComments(for: postID)
    }
    
    private var commentsList: some View {
        Group {
            if viewModel.isLoading {
                ProgressView()
            } else if viewModel.comments.isEmpty {
                Text("No comments yet. Be the first to comment!")
                    .foregroundColor(.secondary)
                    .font(.system(size: 14))
            } else {
                VStack(alignment: .leading) {
                    ForEach(viewModel.comments) { comment in
                        CommentRow(comment: comment, currentUserID: userHolder.person.userID) {
                            Task {
                                await deleteComment(comment)
                            }
                        }
                    }
                    .listStyle(PlainListStyle())
                }
            }
        }
    }
    
    private var errorView: some View {
        Group {
            if let errorMessage = viewModel.errorMessage {
                Text(errorMessage)
                    .foregroundColor(.red)
                    .padding(.horizontal)
            }
        }
    }
    
    private var commentInputField: some View {
        HStack (alignment: .top) {
            ZStack (alignment: .leading) {
                TextEditor(text: $newCommentText)
                    .frame(minHeight: 35)
                    .frame(maxWidth: .infinity)
                    .font(.system(size: 16))
                    .padding(.leading, 5)
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(Color.gray, lineWidth: 0.5)
                    )
                    .background(Color.white) // Ensure background color is clickable and matches
                    .cornerRadius(8)
                
                // Placeholder
                if newCommentText.isEmpty {
                    Text("Add a comment...")
                        .foregroundColor(.gray)
                        .padding(.leading, 10)
                        .font(.system(size: 14))
                        .allowsHitTesting(false) // Make sure the placeholder doesn't block touches
                }
            }
            
            if !newCommentText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                Button { Task { await postComment() } }
                label: {
                    tagModelView(textLabel: "Post", textSize: 14, foregroundColor: .white, backgroundColor: .blue)
                }
                .disabled(isCommentTextEmpty)
                .padding(.leading, 1)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    private var isCommentTextEmpty: Bool {
        newCommentText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }
    
    private func postComment() async {
        guard !isCommentTextEmpty else { return }
        await viewModel.addComment(to: postID, text: newCommentText, person: userHolder.person)
        newCommentText = ""
        isCommentFieldFocused = false
        await viewModel.fetchComments(for: postID)
    }

    private func deleteComment(_ comment: Comment) async {
        if let commentID = comment.id {
            await viewModel.deleteComment(postID: postID, commentID: commentID)
        } else {
            print("Cannot delete comment: Invalid comment ID")
        }
    }
}

struct CommentRow: View {
    let comment: Comment
    let currentUserID: String
    var onDelete: () -> Void

    @State private var showDeleteConfirmation = false
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 7) {
                HStack (alignment: .top) {
                    ProfilePictureAvatar(firstName: comment.firstName, lastName: comment.lastName, imageSize: 35, fontSize: 16)
                    VStack (alignment: .leading, spacing: 10) {
                        HStack (spacing: 5) {
                            Text((comment.firstName + " " + comment.lastName)
                                .capitalized)
                                .fontWeight(.medium)
                                .font(.system(size: 14))
                            Text(PostHelper().relativeTimeStringAbbrev(for: comment.createdAt))
                                .font(.caption)
                                .foregroundColor(.secondary)
                            Spacer()
                        }
                        Text(comment.text)
                            .font(.system(size: 16))
                    }
                }
                
            }
            Spacer()
            if comment.userID == currentUserID {
                Button(action: {
                    showDeleteConfirmation = true
                }) {
                    Image(systemName: "trash")
                        .foregroundColor(.red)
                }
            }
        }
        .padding(.vertical, 5)
        .confirmationDialog(
            "Confirm delete?",
            isPresented: $showDeleteConfirmation,
            titleVisibility: .visible
        ) {
            Button("Delete", role: .destructive, action: onDelete)
            Button("Cancel", role: .cancel) { }
        } message: {
            Text("This action cannot be undone.")
        }
    }
}
